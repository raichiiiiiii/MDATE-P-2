# MDATE Coin & Wallet — Implementation Plan

**Companion:** `docs/coin-wallet-spec.md`  
**Repository baseline:** `main` at `cada922bd274064497f6b0e8362a7183216e7a82`  
**Scope:** PostgreSQL wallet/ledger, authenticated wallet API, Find the Pair completion evidence, Expo wallet API/hook, dashboard balance.

## 1. Repository findings

- Express 5 + TypeScript is the existing backend, with clean-architecture folders under `src/express-test/src/`.
- `pgPool.ts` exports the shared PostgreSQL pool; dependency composition lives in `main/container.ts`; routers are mounted in `main/app.ts`.
- `requireAuth` sets `res.locals.userId`; `requireActiveUser` is the existing post-setup guard.
- PostgreSQL fresh-database scripts are under `infra/postgres/init/`; existing-volume migrations are maintained separately under `infra/postgres/migrations/`.
- Expo exposes `apiRequest` through `useAuth()`. The dashboard metric was only a placeholder and can be replaced without changing navigation.
- Find the Pair currently computes pair rewards on the client and has no persisted server session. Challenge currently labels its assessment as a prototype demonstration that does not count toward clinical scoring or XP.

## 2. Implementation decisions

1. Keep wallet data separate from `users`; `user_wallets` is a materialized balance and `coin_transactions` remains the ledger.
2. Keep all balance/ledger/unlock changes inside one PostgreSQL transaction. Lock the user's wallet row before idempotency, caps, catalog resolution, and updates.
3. Reject mismatched reuse of an idempotency key. A retry of the same operation returns the original transaction with `duplicate: true`.
4. Preserve the ledger across user deletion by using a restrictive user foreign key for ledger rows. This intentionally supersedes the sample `ON DELETE CASCADE`, which would otherwise contradict append-only retention.
5. Do not accept coin amounts from the client. Reward values and UTC-day caps are resolved from `coin_reward_rules` inside the transaction; active item cost is read under a catalog row lock. Duplicate idempotency is checked first so retries still return their original result if a rule or item is later disabled/changed.
6. `SESSION_COMPLETE` is claimable only against a server-issued completed Find the Pair session. The server snapshots the ten active question IDs from the two published five-question QSets when the session starts; later matches must belong to that snapshot, and duplicate match posts are harmless. Reward claiming and `reward_claimed_at` are committed atomically with the ledger.
7. Daily caps use UTC calendar days consistently, rather than depending on the host/container timezone.
8. Challenge rewards remain disabled until its attempt/evaluation flow records an authoritative completion on the backend. The current prototype-only evaluation must not mint wallet coins.

## 3. Delivery phases

### Phase A — Database and domain

- Add wallet, ledger, reward-rule, store-catalog, unlock, and Find the Pair session-evidence tables in migration/init `007_coin_wallet.sql`.
- Protect ledger rows from UPDATE/DELETE with a database trigger.
- Add domain contracts and application services for wallet transactions and training session completion.

### Phase B — PostgreSQL and HTTP

- Add transaction-safe PostgreSQL repositories.
- Mount authenticated routes for wallet summary, history, reward claim, spend, and Find the Pair session evidence.
- Validate all request bodies and map expected domain conflicts to stable HTTP errors.

### Phase C — Expo

- Add typed wallet API wrappers, session-evidence helpers, and `useWallet`.
- Replace the dashboard coin placeholder with the server balance; wallet fetch failure leaves the rest of the dashboard navigable.
- The backend session evidence endpoints and Expo helper methods are included. The existing Find the Pair screen is not yet changed to emit match events and claim automatically; that UI wiring is a separate follow-up, so no reward can be earned from the existing activity screen until it is connected.

### Phase D — Verification / follow-up

- Apply migration `007` to an existing volume; Docker init scripts only run automatically for a newly initialized PostgreSQL data directory.
- Run backend `npm run typecheck`, `npm test`, and `npm run build`; run Expo `npx tsc --noEmit`.
- Exercise concurrency, duplicate idempotency, daily cap, item redemption, and session claim integration against PostgreSQL.
- Wire Find the Pair match events and the idempotent claim into `FindThePairSessionScreen`, then refresh wallet state after a successful claim.
- Wire Challenge reward eligibility only after its server-side attempt record can establish completion independently of client-supplied coin values.

## 4. Acceptance mapping

| Acceptance area | Implementation |
|---|---|
| Non-negative balance | Wallet row lock + guarded balance calculation + DB CHECK |
| Atomic ledger/balance | One PostgreSQL transaction for ledger, wallet, and unlock/session marker |
| Idempotent retry | Unique `(user_id, idempotency_key)` + semantic payload comparison |
| Double spend | `SELECT ... FOR UPDATE` on `user_wallets` serializes same-user mutations |
| Reward amount authority | Database reward rule; no request amount accepted |
| Session completion verification | Server session row + validated, unique Find the Pair match IDs |
| Daily cap | UTC-day count inside the wallet mutation transaction |
| Store price authority | Active catalog item and current cost resolved under row lock, after idempotency replay check |
| Offline dashboard | Wallet hook captures fetch error; dashboard continues rendering |

## 5. Deliberate boundaries

- No store UI/catalog browsing screen is added because the repository has no store route or design specification yet. The API and seeded catalog support redemption; the client should add a store screen against `GET /api/v1/me/wallet` and the catalog contract in a later UI task.
- `ChallengeScreen` is not granted `SESSION_COMPLETE` yet. A client-side “Finish practice” press is not evidence of a completed therapeutic attempt.
- The Find the Pair match evidence proves that the authenticated account submitted all valid pair IDs for a server-issued session. It is a server-side eligibility boundary, not a tamper-proof proof of human interaction; stricter anti-automation would require server-mediated per-match challenge tokens/rate policy.
- The seeded `SESSION_COMPLETE` payout starts at 25 coins and is configurable in `coin_reward_rules`. Existing on-screen pair score calculations remain a practice score and are not used as a wallet amount.
