# MDATE account-security integration overlay

This is a root-relative source overlay for the repository `MDATE-P-2`.

## Apply

1. Back up or commit your current working tree.
2. Extract this ZIP into the repository root (`MDATE-P-2`), preserving folders and allowing the two listed files to be overwritten.
3. The overlay changes only:
   - `src/express-test/src/main/container.ts`
   - `src/expo-test/src/features/auth/AuthProvider.tsx`

## What it fixes

- Registers `AccountSecurityService` with the existing PostgreSQL repository, shared bcrypt hasher and SMTP email-change mailer.
- Exports `accountSecurityService` for `securityController.ts` and `requireAuth.ts`.
- Adds `confirmEmailChange()` to the Expo authentication context and connects it to `POST /api/v1/auth/email-change/confirm`, which already exists in the backend routes.

## Verify after extraction

From `src/express-test`:

```powershell
npm run typecheck
npm run build
```

From `src/expo-test`:

```powershell
npx tsc --noEmit
```

Then verify the database migration before testing email changes:

```sql
SELECT to_regclass('public.email_change_requests');
```

If it returns `NULL`, apply `infra/postgres/migrations/005_account_management.sql` to the existing PostgreSQL Docker database. Do not reapply it unnecessarily if the table exists.

This ZIP does not contain database files, environment secrets, dependencies, build output, or unrelated application files.
