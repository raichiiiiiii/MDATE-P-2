# MDATE Hierarchical Coin Distribution & Decoupled Game Modes

**Implementation companion to:** `docs/coin-wallet-spec.md` and `docs/design-spec-v3.2.3.md`  
**Database migration:** `008_hierarchical_rewards_and_wallet_trigger.sql`  
**Status:** Implementation overlay prepared; application-level end-to-end verification remains required.

## 1. Scope

This implementation extends the existing MDATE wallet and training-session foundation. It does not introduce a second wallet, a second training-content hierarchy, or a second session system.

It adds:

- Database-triggered zero-balance wallet provisioning for every inserted `users` row, plus a one-time backfill.
- Version-scoped module reward pools, submodule game-mode identifiers, and repeatable difficulty tiers.
- Exact-rational hierarchical reward calculation and deterministic Hamilton rounding.
- Reward snapshots pinned to a training session so later content edits cannot change an in-progress session's payout.
- Server-side reward settlement through the existing append-only coin ledger.
- A game-mode registry with separate state adapters and views for Find the Pair, Challenge, Story Telling, and Standard Q-Set.
- A shared Expo session runner and reward-tree UI for module, submodule, and Q-Set distributions.

## 2. Repository Schema Reconciliation

The specification's conceptual hierarchy is retained, but several names are aligned with the actual repository schema.

| Concept | Actual repository representation | Reason |
|---|---|---|
| Module | `training_modules` joined to a published `module_versions` row | There is no `modules` table. The module content is versioned. |
| Module reward pool | `module_versions.reward_coins` | The reward pool is pinned to the published version rather than being mutable across all versions. |
| Submodule mode | `submodules.game_mode` | The existing `exercise_type` remains for compatibility with current content DTOs and screens. |
| Q-Set difficulty | `q_sets.difficulty_index`, exposed as API field `difficulty` | Avoids renaming a live column and breaking seed content. |
| Q-Set difficulty index | Non-unique `(submodule_id, difficulty_index, id)` index | Multiple Q-Sets at one difficulty tier are required by the distribution formula. |

`module_versions.reward_pool_points` is not removed by this migration. It is a legacy training-content field and must not be silently reinterpreted as the new wallet coin budget. `reward_coins` is the explicit coin reward pool.

## 3. Wallet Provisioning

Migration 008 installs `fn_init_user_wallet()` and `trg_users_init_wallet` after migration 007 has created `user_wallets`.

The trigger inserts `(NEW.id, 0, 0)` into `user_wallets` with `ON CONFLICT DO NOTHING`. This executes in the same PostgreSQL transaction as the user insert. The migration also backfills users that predate the trigger.

Existing lazy initialization in `PgWalletRepository` remains valid and harmless. It is an application-level guard for older databases or unusual operational states; the unique `user_id` primary key and `ON CONFLICT` make both paths safe.

## 4. Reward Distribution

For a published module version with a configured pool `R_M`:

1. Count active questions across all Q-Sets in every submodule.
2. Allocate each submodule its exact rational share proportional to its active question count.
3. Within each submodule, sort the distinct difficulty tiers ascending and assign Fibonacci weights `1, 2, 3, 5, 8, ...`.
4. Divide each tier's share equally among the Q-Sets at that difficulty.
5. Divide each Q-Set's share equally among its active questions.
6. Apply one global Hamilton allocation across all active questions to obtain integer coin rewards whose sum is exactly `R_M`.

The exact per-question rational share used by the calculator is:

\[
R(u)=R_M \times \frac{Q(s)}{Q_M} \times \frac{w_j}{W} \times \frac{1}{c_j} \times \frac{1}{N(q)}
\]

where `Q(s)` is the active question count for a submodule, `Q_M` is the active question count for the module, `w_j` is the Fibonacci weight for that difficulty tier, `W` is the sum of the tier weights, `c_j` is the number of Q-Sets sharing that tier, and `N(q)` is the active question count in the Q-Set.

The calculator uses `bigint` numerator/denominator pairs. It does not use floating-point approximations for fractional remainder ordering. Hamilton allocation floors each question share, then awards remaining coins in this order:

1. Largest exact fractional remainder.
2. Higher difficulty first.
3. Q-Set ID ascending.
4. Question position ascending.
5. Question ID ascending as a final stable tie-breaker.

For a module with zero active questions, there is no valid divisor. Its full reward pool is reported as `unallocatedCoins`, and no question receives coins. For a non-empty module, the calculator asserts that allocated question coins sum exactly to `module.rewardCoins`.

Aggregated `inheritedRewardCoins` values on submodules and Q-Sets are the sums of the already-rounded integer question allocations. They are not independently rounded at each hierarchy level, which prevents rounding drift.

## 5. Game Mode Mapping

The migration adds `submodules.game_mode` while retaining `exercise_type`.

| Existing `exercise_type` | Default `game_mode` |
|---|---|
| `find_the_pair` | `find_the_pair` |
| `try_to_guess` | `challenge` |
| `tell_me_more` | `story_telling` |
| Unknown/future legacy value | `standard_qset` |

The four allowed `game_mode` values are constrained in PostgreSQL. The Expo registry has an explicit fallback to `standard_qset` for an unknown value returned from an older or newer server.

## 6. Session Snapshot and Settlement

When a rewarded session starts, the backend:

- Resolves the currently published reward tree for the requested submodule.
- Pins the resolved `game_mode` on `training_sessions`.
- Copies each question's computed integer `reward_coins` into `training_session_questions`.
- Returns a session ID and its question snapshot to the client.

A session started before a module edit continues to use its original question reward values. A later session sees the newer published tree.

Find the Pair records unique matched question IDs against the server-pinned session question list. Other game modes submit one outcome for every pinned question; the backend checks exact ID coverage, uniqueness, session ownership, and session state. It records outcomes in `training_session_question_results` but does not accept an `earned_coins` field.

When a session is complete, `HierarchicalTrainingSessionService` sums the pinned question rewards and calls the internal `WalletService.creditTrainingSessionReward()` path. The idempotency key is `training-session:${sessionId}`. The ledger insert, wallet balance update, and `training_sessions.reward_claimed_at` marker are committed in one wallet transaction. If the computed payout is zero, the session is marked settled without creating an illegal zero-amount ledger row.

The public wallet reward-claim endpoint no longer accepts `SESSION_COMPLETE`. Session completion is settled only through the server-side training-session application service. Daily check-in still uses its configured server reward rule.

## 7. Client Reward Trust Boundary

The client displays question-level and aggregate coin values as previews. It never supplies a coin amount to the settlement operation. The API strips `earnedCoins` and accepts only question IDs and attempt metadata.

The current general-purpose result endpoint records `correct`, `attempts`, and `durationMs` as client-reported outcomes. It does not yet replace the clinical speech-assessment pipeline or independently prove a learner's spoken answer. Rewards are participation-based and are not reduced for an incorrect response. Before production launch, the Challenge and Story Telling adapters should be bound to their server-side inference/evaluation results if those outcomes are to be treated as clinically verified evidence. This is distinct from the arithmetic and ledger guarantee: the amount is server-calculated and immutable once pinned, but a malicious client can still automate its own session-result submissions unless the game-specific assessment path provides stronger evidence.

## 8. API Surface

The implementation adds authenticated endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/v1/training/modules/:moduleId/reward-tree` | Module-wide reward allocation |
| `GET` | `/api/v1/training/submodules/:submoduleId/reward-tree` | One submodule's reward allocation |
| `POST` | `/api/v1/training/sessions` | Start a rewarded submodule session |
| `POST` | `/api/v1/training/sessions/:sessionId/matches` | Record a Find the Pair match |
| `POST` | `/api/v1/training/sessions/:sessionId/complete` | Submit non-pair question outcomes |

Existing `/api/v1/modules`, `/api/v1/submodules/:id/q-sets`, and Q-Set content APIs remain available for compatibility. The new reward-tree routes are the authoritative source for `rewardCoins`, `gameMode`, `fibonacciWeight`, and hierarchical inherited totals.

## 9. Frontend Structure

The Expo feature has:

- `core/gameTypes.ts`: shared engine, reward-question, result, and view contracts.
- `core/gameRegistry.ts`: maps known `gameMode` identifiers to an engine and its view.
- `core/useGameSessionRunner.ts`: creates a server session, tracks elapsed session time, records mode-specific results, submits generic completion, and refreshes the wallet after settlement. Per-question `durationMs` is currently a placeholder in the text-mode views; the timer is session-level only.
- Separate model/view pairs for Find the Pair, Challenge, Story Telling, and Standard Q-Set.
- `SubmoduleGameHostScreen.tsx`: loads the reward tree and Q-Set content, displays distribution data, and mounts the correct registry view.

The current Challenge and Story Telling views provide distinct text-based interaction surfaces. Porting the legacy Challenge microphone/audio flow and integrating the clinical inference result into these new adapters is a follow-on task; it is not represented as already completed here.
