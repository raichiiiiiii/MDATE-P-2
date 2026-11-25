MDATE COIN & WALLET — MERGE OVERLAY
==================================

This archive contains repository-relative files for the MDATE-P-2 repository.
Extract the ZIP at the repository root and allow the listed files to merge/overwrite
at their matching paths. No PowerShell, shell, or database-integration scripts are
included.

INCLUDED
--------
- Backend wallet domain, application services, PostgreSQL repositories and HTTP routes.
- PostgreSQL migration 007 in both the fresh-init and existing-volume migration folders.
- Expo wallet API helpers, useWallet hook, and dashboard balance integration.
- Wallet technical specification and implementation plan.

DATABASE
--------
For a new PostgreSQL data directory, infra/postgres/init/007_coin_wallet.sql is part
of the ordered init set. For an existing Docker volume, init scripts do not rerun:
apply infra/postgres/migrations/007_coin_wallet.sql once using your normal PostgreSQL
migration procedure inside the database container. Do not remove/reset the volume.

VALIDATION
----------
After merging and applying the migration, run the repository's existing checks:
- In src/express-test: npm run typecheck, npm test, npm run build
- In src/expo-test: npx tsc --noEmit

IMPLEMENTATION BOUNDARIES
-------------------------
- The wallet endpoints are server-authoritative: clients submit a reward reason and
  reference or a catalog item ID, never a coin amount. Payouts and costs are resolved
  by the server inside the mutation transaction.
- The server-side Find the Pair session/evidence API and Expo client helpers are
  included, but the current FindThePairSessionScreen is not yet wired to create a
  server session, post matched question IDs, and claim at completion. Therefore the
  existing activity screen will not yet credit a reward. This must be connected
  before enabling the reward flow in a release.
- Challenge is not reward-enabled: its current evaluation is marked prototype-only
  and is not authoritative server-side completion evidence.
- The dashboard balance is live API-backed and non-blocking. Before the migration
  is applied, the new /me/wallet endpoint will fail and the dashboard shows an em dash.
- The store spend API and seed catalog exist; no store browsing/redemption UI is added
  because the repository does not yet define a store screen contract.
- Ledger rows reference users with ON DELETE RESTRICT. This prevents account deletion
  from cascading away financial history; the current account lifecycle uses soft
  deletion. A future privacy-erasure workflow must define an audited retention or
  anonymisation policy rather than deleting ledger rows.

BASELINE
--------
Repository default branch: main
Inspected baseline commit: cada922bd274064497f6b0e8362a7183216e7a82
