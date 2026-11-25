# MDATE Coin & Wallet System — Technical Specification

**Status:** Implementation companion for design-spec-v3.2.3  
**Architecture:** Decoupled Wallet + Append-Only Ledger (`domain` → `application` → `infrastructure` → `main`).

## 1. Purpose and invariants

Patients earn coins from server-eligible therapy activities and redeem them for catalog items. Wallet balances are not columns on `users`. `coin_transactions` is the authoritative append-only ledger; `user_wallets` is the transactionally maintained materialized balance.

- Balance is always non-negative; ledger deltas are non-zero and agree with CREDIT/DEBIT direction.
- A ledger insert and balance update commit or roll back together.
- `(user_id, idempotency_key)` identifies one semantic operation. Reusing the key for a different operation is a conflict.
- The server determines payout and item cost. No client-supplied amount is accepted.
- Ledger user references are restrictive so deleting a user cannot cascade-delete financial history. Existing account lifecycle uses soft deletion.

## 2. Database additions

Migration and fresh-init files: `infra/postgres/migrations/007_coin_wallet.sql` and `infra/postgres/init/007_coin_wallet.sql`.

In addition to `user_wallets` and `coin_transactions`, the migration defines:

- `coin_reward_rules`: server-owned payout amount and UTC-day cap (`SESSION_COMPLETE` = 25, maximum 5 per UTC day; `DAILY_CHECKIN` = 10, maximum 1 per UTC day).
- `coin_store_items`: server-owned item names, active state, category and cost. The initial seed contains only the supplied example item `theme-ocean-calm` at 200 coins.
- `user_coin_unlocks`: one-time ownership record linked to the debit ledger transaction.
- `training_sessions` and `training_session_matches`: server-issued Find the Pair session, a start-time snapshot of its ten valid question IDs, and the distinct matched IDs recorded against that snapshot. A session becomes COMPLETED after all ten snapshotted question IDs are recorded.
- Triggers reject UPDATE, DELETE and TRUNCATE on `coin_transactions`. `ADMIN_ADJUSTMENT` is reserved for a future privileged compensating-entry workflow; it is not exposed to patient API requests.

## 3. HTTP API

All endpoints require existing `requireAuth` and `requireActiveUser` middleware.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/me/wallet` | Balance and lifetime earned |
| GET | `/api/v1/me/wallet/transactions?limit=20&cursor=...` | Cursor-paginated ledger history |
| POST | `/api/v1/me/wallet/rewards/claim` | Claim an enabled server reward |
| POST | `/api/v1/me/wallet/spend` | Redeem an active catalog item |
| POST | `/api/v1/me/training-sessions` | Start a verified Find the Pair session |
| POST | `/api/v1/me/training-sessions/:sessionId/matches` | Record one validated matched question |

`SESSION_COMPLETE` requires `referenceId` to be the server-issued completed session UUID. `DAILY_CHECKIN` does not accept a reference ID. Example requests:

```json
{ "reason": "SESSION_COMPLETE", "referenceId": "<completed-session-uuid>", "idempotencyKey": "session:<completed-session-uuid>" }
```

```json
{ "reason": "DAILY_CHECKIN", "idempotencyKey": "daily-checkin:2026-11-25" }
```

```json
{ "itemId": "theme-ocean-calm", "idempotencyKey": "redeem:theme-ocean-calm:request-uuid" }
```

Spend errors include `400 INVALID_ITEM`, `409 INSUFFICIENT_COINS` with `required` and `available`, `409 ITEM_ALREADY_OWNED`, and `409 IDEMPOTENCY_KEY_REUSED`. Reward errors include `409 REWARD_NOT_ELIGIBLE` and `409 REWARD_LIMIT_REACHED`.

## 4. Transaction and concurrency rules

The repository initializes the wallet row if needed, obtains `SELECT ... FOR UPDATE`, checks duplicate idempotency, resolves the current reward rule or active catalog cost under transaction-level row locks, verifies session eligibility, enforces UTC-day caps, inserts the ledger row, updates the materialized wallet, and marks a session rewarded or inserts an unlock before COMMIT. Checking idempotency first ensures that a retry still returns the original result if a reward rule or item is subsequently disabled or repriced. Any error rolls back the full operation.

Same-user spends serialize on the wallet row. Two 100-coin spends against a 150-coin balance therefore cannot both commit. A retry with the same key and same semantic payload returns the original ledger result without mutation; a different payload with that key is rejected.

## 5. Client integration

Expo provides typed wallet API wrappers, Find the Pair session/match/claim helpers, and a `useWallet` hook. Dashboard balance loading is non-blocking: an offline/API failure displays an unavailable placeholder and does not block training navigation. The session helper contract is ready, but the current Find the Pair screen still needs to call it when matches occur and claim on completion; until that UI wiring lands, no activity reward is credited from that screen. Local score values are never submitted as payout amounts.

Challenge reward claims remain unavailable until the exercise has a server-side completion record. A client-side finish action alone is not accepted as proof of activity completion.
