# MDATE Hierarchical Coin Distribution — Implementation Plan

**Repository:** `raichiiiiiii/MDATE-P-2`  
**Base branch:** `main`  
**Inspected base commit:** `6831e71d81d62cf0b57648903409d93716502057`  
**Companion specification:** `docs/hierarchical-coin-distribution-spec.md`

## 1. Planning Outcome

Implement the hierarchical reward model as an extension of the existing wallet and training-session system. Use the existing clean-architecture layers and current PostgreSQL schema, rather than creating parallel training content, session, or wallet models.

The implementation is split into four merge units:

1. PostgreSQL migration and reward calculation domain.
2. Backend reward-tree queries and rewarded-session settlement.
3. Expo game-mode registry, separate engines/views, shared session runner, and submodule host.
4. Existing selector-screen patches to display reward allocations and route into the new host.

## 2. Important Repository Decisions

### Use the live schema names

The specification described a `modules` table, but the repository stores module identity in `training_modules` and versioned content in `module_versions`. Therefore `reward_coins` belongs to `module_versions`, where the published reward pool can remain tied to a specific content version.

The repository already has `q_sets.difficulty_index`. The migration keeps this storage name and exposes `difficulty` in the new reward-tree API. It drops the current unique constraint on `(submodule_id, difficulty_index)` and replaces it with a non-unique index because same-difficulty Q-Sets must share one Fibonacci tier pool.

### Keep current APIs compatible

The current training-content endpoints and legacy `exercise_type` remain. The new reward-tree routes provide the new distribution and `game_mode` fields. The client is moved to the reward-tree source for the new host and coin displays.

### Keep wallet mutation server-authoritative

A session's per-question rewards are copied into `training_session_questions` at session start. `WalletService` is the only application path that submits a `SESSION_COMPLETE` credit. The wallet repository patch permits positive internal session credits, verifies the completed session, checks idempotency, updates the wallet and ledger atomically, and marks the session rewarded.

## 3. Implementation Inventory

### Backend files added or replaced

- `infra/postgres/init/008_hierarchical_rewards_and_wallet_trigger.sql`
- `infra/postgres/migrations/008_hierarchical_rewards_and_wallet_trigger.sql`
- `src/express-test/src/domain/training/TrainingGameMode.ts`
- `src/express-test/src/domain/training/RewardCalculator.ts`
- `src/express-test/src/domain/training/RewardCalculator.test.ts`
- `src/express-test/src/domain/training/TrainingRewardRepository.ts`
- `src/express-test/src/domain/training/RewardedTrainingSessionRepository.ts`
- `src/express-test/src/infrastructure/persistence/postgres/PgTrainingRewardRepository.ts`
- `src/express-test/src/infrastructure/persistence/postgres/PgRewardedTrainingSessionRepository.ts`
- `src/express-test/src/application/training/TrainingRewardService.ts`
- `src/express-test/src/application/training/HierarchicalTrainingSessionService.ts`
- `src/express-test/src/application/wallet/WalletService.ts`
- Reward-tree and rewarded-session HTTP controllers/routes
- Updated `src/express-test/src/main/container.ts` and `app.ts`

One existing backend file is changed by a targeted patch rather than a full replacement: `src/express-test/src/infrastructure/persistence/postgres/PgWalletRepository.ts`. The patch is in `merge-patches/backend-wallet-repository.patch`.

### Expo files added or replaced

- Core engine contracts, registry, and shared runner with session-level elapsed-time tracking.
- Independent Find the Pair, Challenge, Story Telling, and Standard Q-Set model implementations.
- Independent React Native views for each game mode.
- `hierarchicalTrainingApi.ts` for the reward-tree and rewarded-session endpoints.
- `SubmoduleGameHostScreen.tsx` and its Expo Router route.
- `QSetExerciseScreen.tsx` compatibility update for game-mode fallback.

Two existing selector files are modified using patch files:

- `merge-patches/expo-module-selector-reward.patch`
- `merge-patches/expo-activity-selector.patch`

They add module/submodule/Q-Set coin visibility and route activity selection through the new submodule game host.

## 4. Database Deployment

The migration is copied byte-for-byte to both the migration directory and fresh-database init directory.

- Existing Docker PostgreSQL volume: apply `infra/postgres/migrations/008_hierarchical_rewards_and_wallet_trigger.sql` after migration 007.
- Fresh PostgreSQL volume: the init runner applies `infra/postgres/init/008_hierarchical_rewards_and_wallet_trigger.sql` after 007.

Do not delete or reset the existing Docker volume to install this feature. The migration backfills wallet rows for existing users without changing their UUIDs or account records.

## 5. Merge Sequence

1. Extract the backend overlay into the repository root and merge the files.
2. Apply `merge-patches/backend-wallet-repository.patch` to the existing `PgWalletRepository.ts` using a Git/IDE patch-application feature.
3. Extract the Expo overlay into the repository root and merge the files.
4. Apply `merge-patches/expo-module-selector-reward.patch` and `merge-patches/expo-activity-selector.patch` using the same patch-application feature.
5. Apply migration 008 to the existing database volume.
6. Install dependencies using the repository's normal project workflow and run backend/Expo typechecks and builds.

The ZIPs contain no PowerShell, batch, command, shell, or other integration scripts. The `.patch` files are text diffs, not executable scripts.

## 6. Verification Matrix

| Test | Expected outcome | Prepared verification |
|---|---|---|
| Three submodules with 3, 7, 12 questions and 100 coins | Totals conserve exactly 100; 15/35/50 under the specified global tie-break | Domain test passes |
| Duplicate Q-Set difficulty values | One Fibonacci tier shared by all Q-Sets at that difficulty | Domain tests pass |
| Module without active questions | 0 allocated, full amount unallocated | Domain test passes |
| Hamilton tie order | Deterministic across repeated calculations | Domain test passes |
| New user insert | Trigger creates exactly one zero-balance wallet | Migration created; PostgreSQL integration pending |
| Existing users | Backfill creates missing zero-balance wallets only | Migration created; PostgreSQL integration pending |
| Session starts then content changes | Session retains question reward snapshot | Repository implementation prepared; PostgreSQL integration pending |
| Duplicate session completion | Existing ledger result returned without a second credit | Existing wallet transaction extended; integration pending |
| Unknown game mode | Expo resolves to Standard Q-Set | Registry implementation prepared |
| Four game modes | Separate adapter state/action contracts and views | Engine tests pass |

## 7. Checks Performed Here

- TypeScript/TSX syntax transpilation across all 33 overlay source files: **0 syntax diagnostics**.
- RewardCalculator tests: **5 passed**.
- Expo game-engine model tests: **5 passed**.
- Isolated backend reward/session strict TypeScript check with lightweight `pg` stubs: **passed**.
- Isolated Expo runner/host strict TypeScript check with lightweight React Native/Expo stubs: **passed**.
- All three patch files parse as unified diffs (`git apply --numstat`). Their exact application against the full repository working tree has not been exercised in this container.
- Init and migration SQL copies are byte-identical.
- The two new Express routers use the correct `/api/v1/training/...` path prefix without duplicate `/training` segments.

A full project typecheck against the real dependencies, Expo bundle, live API integration tests, and PostgreSQL migration execution were not run because this workspace does not contain the repository's installed dependencies or an attached PostgreSQL service. These remain mandatory merge validation before deployment.

## 8. Follow-up Work Before Production

- Run the migration against a copy of the current Docker database volume.
- Run full Express and Expo `typecheck` and build commands after merge.
- Run concurrent wallet/session settlement integration tests against PostgreSQL.
- Port the existing Challenge microphone/recording flow into the new Challenge adapter/view and feed server-side speech-assessment outcomes into session evidence.
- Bind Story Telling evaluation to its intended assessment pipeline. The current Story Telling view captures text, not a clinically validated narrative score.
- Replace placeholder per-question `durationMs: 0` values with measured question timing; the shared runner currently exposes an elapsed session timer only.
- Add an operational/admin editing surface for `module_versions.reward_coins`, `submodules.game_mode`, and Q-Set difficulty. The database/API implementation reads these configuration values; it does not add a content-authoring UI.
- Confirm whether participation rewards should remain equal for correct and incorrect answers. The current implementation intentionally does not penalize errors and treats `correct` as client-reported telemetry, not as a clinical score.
