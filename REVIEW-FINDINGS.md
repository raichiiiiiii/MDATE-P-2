# Review findings

Reviewed `main` at `c9fcd0f9d23de5b8759e381381a13ac6e8b221d1` on 2026-11-08.

## Addressed in this overlay

- **Expected sign-in rejection is logged as a console error.** `AuthEntryScreen` previously called `console.error` for every rejected login. The backend intentionally returns HTTP 401 with `error: "invalid_credentials"` and a generic message. The revised API client preserves that error code, and the screen presents it as an ordinary form validation/authentication response without production console logging.
- **Existing Postgres volumes miss init-only schema.** Training and account-management DDL existed only in `infra/postgres/init`. Those scripts are applied when the Postgres data directory is initialized, not every time a container starts. The overlay adds identical idempotent scripts under `infra/postgres/migrations` for explicit application to an existing volume.
- **Expo cache is not ignored.** The repository currently tracks `src/expo-test/.expo`, including local development logs. `.gitignore` now ignores `.expo/`; remove existing tracked cache entries from the index with the command in the merge README.

## Remaining issues to resolve separately

1. **High — full-stack Compose configuration does not match the repository layout.** `docker/compose/compose.yaml` builds `../../src/frontend` and `../../src/backend`, but the committed projects are `src/expo-test` and `src/express-test`; there are no matching Dockerfiles in those directories. The same Compose file also publishes port 9000/9001 from both `object-storage` and `minio`, which causes a host-port collision if both services are started. The intended deployment topology needs to be decided before editing this file.

2. **Medium — sign-out is not resilient to an API/network failure.** `AuthProvider.signOut()` awaits the backend logout request before clearing local token/user state. If that request fails, local state is left authenticated. A follow-up change should clear local state in a `finally` block while still reporting that server-side revocation could not be confirmed.

3. **Medium — avatar download size check is not fully memory-bounded.** `MinioObjectStorage.getObjectBytes()` checks the content length when supplied, then calls `transformToByteArray()` and checks the byte count afterwards. If the object store omits or misreports content length, an oversized object is fully buffered before rejection. Replace this with a bounded streaming read or enforce a strict upload-size condition before buffering.

4. **Medium — email-change request may remain pending after mail delivery failure.** `AccountSecurityService.requestEmailChange()` persists the pending request before sending the verification email. If SMTP delivery fails, the request remains pending until expiry, potentially blocking a replacement request for that account/email. Consider invalidating that pending token on mailer failure or using an outbox/retry mechanism.

5. **Medium — Compose is not the only required database setup path.** The SQL overlay addresses the missing training and account-management tables, but any future schema change should be added to a numbered migration and applied through a migration process, rather than relying exclusively on `init/` scripts.

6. **Low — automated test coverage is not wired up.** The Express package exposes typecheck/build scripts but no test script or test runner. The authentication and security flows should receive unit/integration coverage, especially for invalid credentials, refresh-token rotation/reuse, revoked sessions, and single-use email/avatar tokens.

## Positive findings

- Container wiring on current `main` already exports `accountSecurityService` and `profileService`; no duplicate service-registration patch is needed.
- `requireAuth` checks the refresh-token family for revocation, and password/email security handlers are behind authentication middleware.
- Passwords are hashed by the backend; reset/email-change tokens are hashed before database storage.
- The login API returns a generic credential failure message, avoiding different public messages for unknown email and incorrect password.
