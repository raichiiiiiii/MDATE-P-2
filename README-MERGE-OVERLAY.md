# MDATE review + merge overlay

Target repository: `raichiiiiiii/MDATE-P-2`
Reviewed default branch: `main`
Reviewed commit: `c9fcd0f9d23de5b8759e381381a13ac6e8b221d1`

## What this overlay changes

1. `src/expo-test/src/features/auth/apiClient.ts`
   - Preserves the backend's machine-readable `error` value as `ApiError.code`.
   - Keeps the HTTP status in `ApiError.status`.

2. `src/expo-test/src/features/auth/AuthEntryScreen.tsx`
   - Treats `invalid_credentials` as a normal sign-in outcome and displays the generic message in the form without `console.error`.
   - Gives a clear message for an already-registered email during sign-up.
   - Shows a generic temporary-unavailable message for HTTP 5xx and network failures.
   - Emits diagnostic warnings only in development, and does not log expected 4xx authentication failures.
   - Applies the same expected-failure logging rule to password-reset requests.

3. `infra/postgres/migrations/003_training_content.sql` and `005_account_management.sql`
   - Copies the repository's idempotent SQL from `infra/postgres/init/` into a migration directory.
   - This is for databases backed by an existing Docker volume. Files under `init/` are not automatically replayed when a non-empty Postgres data volume starts.
   - The training script creates `training_modules`, module versions, submodules, question sets, questions, media metadata, indexes, and starter rows. The account-management script creates the profile/avatar and email-change schema.

4. `.gitignore`
   - Adds `.expo/` so local Expo state and logs are not newly committed.

## Merge instructions

1. Back up or commit your current working tree.
2. Extract this ZIP into the repository root and allow the listed files to merge/overwrite at the same relative paths.
3. Review the diff before committing:

   ```powershell
   git status --short
   git diff -- .gitignore src/expo-test/src/features/auth/apiClient.ts src/expo-test/src/features/auth/AuthEntryScreen.tsx
   ```

4. If `src/expo-test/.expo` is already tracked, remove only its Git index entries (this does not delete your local Expo cache):

   ```powershell
   git rm -r --cached src/expo-test/.expo
   ```

5. Apply the SQL scripts to the existing Docker database. The repository Compose file names the database container `postgres`; replace the container name and database user if your running container differs. Run from the repository root, with the correct database name:

   ```powershell
   $pgUser = "YOUR_POSTGRES_USER"
   $pgDb = "mdate_db"
   Get-Content -Raw .\infra\postgres\migrations\003_training_content.sql | docker exec -i postgres psql -v ON_ERROR_STOP=1 -U $pgUser -d $pgDb
   Get-Content -Raw .\infra\postgres\migrations\005_account_management.sql | docker exec -i postgres psql -v ON_ERROR_STOP=1 -U $pgUser -d $pgDb
   ```

   These scripts are idempotent for the schema/data they define. They do not drop user data or reset the volume. Do not use `docker compose down -v` as a migration shortcut; that would delete the database volume.

6. Verify the schema:

   ```powershell
   docker exec -i postgres psql -U $pgUser -d $pgDb -c "SELECT to_regclass('public.training_modules') AS training_modules, to_regclass('public.avatar_upload_intents') AS avatar_upload_intents, to_regclass('public.email_change_requests') AS email_change_requests;"
   ```

7. Verify the projects locally:

   ```powershell
   Push-Location .\src\express-test
   npm ci
   npm run typecheck
   npm run build
   Pop-Location

   Push-Location .\src\expo-test
   npm ci
   npx tsc --noEmit
   Pop-Location
   ```

## Scope and limitations

This ZIP does not rewrite the Docker Compose deployment because the current `docker/compose/compose.yaml` references `src/frontend` and `src/backend`, which are not present in the repository tree; no frontend/backend Dockerfiles are present either. It also defines both `object-storage` and `minio` services with overlapping host ports 9000/9001. See `REVIEW-FINDINGS.md` before relying on the full-stack Compose file.

The ZIP was prepared from repository source inspection. TypeScript builds and SQL application were not executed against your local machine or Docker database; run the verification steps above after merging.
