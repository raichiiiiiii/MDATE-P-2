# MDATE Profile + Account Security Overlay

This is a root-relative source overlay for the `MDATE-P-2` repository. Extract it at the repository root and allow the included files to overwrite their existing counterparts.

## Files included

- `src/express-test/src/main/container.ts`
  - Registers `accountSecurityService` using the existing `AccountSecurityService`, `PgAccountSecurityRepository`, password hasher and email-change mailer.
  - Registers `profileService` using the existing `ProfileService`, `PgProfileRepository` and MinIO object-storage adapter.
  - Keeps the earlier `confirmEmailChange` frontend context fix in the included AuthProvider.
- `src/expo-test/src/features/auth/AuthProvider.tsx`
  - Exposes `confirmEmailChange()` for the existing email verification route.

## MinIO behavior

MinIO is treated as optional at startup. The container constructs `MinioObjectStorage` only when both `MINIO_APP_USER` and `MINIO_APP_PASSWORD` are configured. Without those credentials, profile reads and display-name updates still work, while avatar upload endpoints return the existing `AvatarStorageUnavailableError` response (HTTP 503).

To enable avatar uploads, configure `MINIO_ENDPOINT`, `MINIO_APP_USER`, `MINIO_APP_PASSWORD`, and the relevant bucket settings in the Express environment.

## Database requirement

The profile repository uses `avatar_storage_key`, `avatar_content_type`, `avatar_updated_at`, and `avatar_upload_intents`. These are created by `infra/postgres/migrations/005_account_management.sql`. Confirm the migration has been applied to the existing PostgreSQL Docker volume before testing avatar operations.

The account-security repository also uses `email_change_requests` from the same migration and `refresh_sessions` / `password_reset_tokens` from migration `004_local_identity.sql`.

## Verify

From `src/express-test`:

```powershell
npm run typecheck
npm run build
```

From `src/expo-test`:

```powershell
npx tsc --noEmit
```

The ZIP contains source changes only. It does not modify Docker configuration, environment files, database contents or migration state.
