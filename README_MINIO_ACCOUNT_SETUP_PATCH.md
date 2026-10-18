# MDATE Express + MinIO overlay

This is a root-level overlay for `C:\Users\User\dev\test`. Extract it into that folder and choose **merge** if Windows asks. It adds files; it does not replace your existing Expo config, Express routes, Docker Compose base file, PostgreSQL schema, or `.env` files.

## What this patch provides

- `docker/compose/compose.minio.yaml`: a Compose overlay for MinIO, with persistent storage and localhost-only-by-default S3 API binding.
- `docker/scripts/init-minio.sh`: creates three private buckets (`mdate-audio`, `mdate-assets`, `mdate-exports`) and a backend-only MinIO user limited to those buckets.
- `src/express-test/src/infrastructure/storage/minio/MinioObjectStorage.ts`: an AWS SDK v3 S3-compatible adapter for put/delete and short-lived presigned upload/download URLs.
- `src/express-test/src/application/ports/ObjectStorage.ts`: an application-facing storage port, so the rest of the app does not need to depend on the AWS SDK.
- `src/express-test/src/application/account-setup/accountSetupPreferences.ts`: runtime validation/types for all fields sent by the current account setup screen.
- `src/express-test/src/infrastructure/persistence/postgres/AccountSetupPreferencesWriter.ts`: PostgreSQL upserts for `accessibility_preferences` and `voice_preferences`.

**Important integration boundary:** the folder tree was available, but not the contents of your existing Express files. Therefore, the new preference writer is not silently wired into `CompleteAccountSetup.ts`, `accountController.ts`, or `PgAccountRepository.ts`. Those files already exist and may contain project-specific dependency injection. The merge instructions below show exactly what to connect. I have not run your project's typecheck or started your Docker stack in this environment.

## 1. Add the MinIO secrets

Open the existing project-root `.env` at `C:\Users\User\dev\test\.env`. **Do not replace it.** Add these lines and use different long random passwords for the root user and application user:

```dotenv
MINIO_ROOT_USER=mdate-local-admin
MINIO_ROOT_PASSWORD=REPLACE_WITH_A_LONG_RANDOM_ROOT_PASSWORD
MINIO_APP_USER=mdate-app-local
MINIO_APP_PASSWORD=REPLACE_WITH_A_DIFFERENT_LONG_RANDOM_APP_PASSWORD
```

Also add the MinIO client settings to the existing `src/express-test/.env`:

```dotenv
MINIO_ENDPOINT=http://localhost:9000
MINIO_REGION=us-east-1
MINIO_APP_USER=mdate-app-local
MINIO_APP_PASSWORD=REPLACE_WITH_THE_SAME_APP_PASSWORD_AS_PROJECT_ROOT_ENV
MINIO_BUCKET_AUDIO=mdate-audio
MINIO_BUCKET_ASSETS=mdate-assets
MINIO_BUCKET_EXPORTS=mdate-exports
MINIO_PRESIGNED_URL_TTL_SECONDS=300
```

Replace the example app password with the exact value of `MINIO_APP_PASSWORD` in the project-root `.env`. The application should use the app credentials, **not** the MinIO root credentials. Keep both `.env` files untracked and never paste their contents into chat.

## 2. Start MinIO

Open PowerShell at `C:\Users\User\dev\test` and run:

```powershell
docker compose -f .\docker\compose\compose.yaml -f .\docker\compose\compose.minio.yaml config
docker compose -f .\docker\compose\compose.yaml -f .\docker\compose\compose.minio.yaml up -d minio
docker compose -f .\docker\compose\compose.yaml -f .\docker\compose\compose.minio.yaml run --rm minio-init
Invoke-WebRequest http://localhost:9000/minio/health/ready
```

The first command validates the merged Compose configuration. The next starts the storage service, and the third initializes buckets and the limited application identity. If the existing base file names the PostgreSQL service differently or uses custom networks, this overlay still leaves those existing services intact. The Express app running directly on Windows reaches MinIO through `http://localhost:9000`.

Open the MinIO console at `http://localhost:9001` and sign in with the **root** credentials for administration only. The S3 API is port `9000`; the browser console is port `9001`. The console is always bound to loopback. The S3 API is loopback-only by default, so other devices cannot reach it unless you deliberately change `MINIO_BIND_ADDRESS`.

Useful commands:

```powershell
docker compose -f .\docker\compose\compose.yaml -f .\docker\compose\compose.minio.yaml ps
docker compose -f .\docker\compose\compose.yaml -f .\docker\compose\compose.minio.yaml logs minio
```


### Optional: direct uploads from the Samsung tablet

Skip this section unless the tablet/app will upload directly to a presigned MinIO URL. A presigned URL must use a hostname the tablet can reach. On the Windows PC, find its IPv4 address on your private Wi-Fi network, then set `MINIO_BIND_ADDRESS=<PC_LAN_IP>` in the project-root `.env` and set `MINIO_ENDPOINT=http://<PC_LAN_IP>:9000` in `src/express-test/.env`. Restart the MinIO service after changing the Compose binding:

```powershell
docker compose -f .\docker\compose\compose.yaml -f .\docker\compose\compose.minio.yaml up -d --force-recreate minio
```

Then run `docker compose ... run --rm minio-init` again if needed. In Windows Defender Firewall, allow inbound TCP 9000 **only on the Private profile/local development network**. Do not expose port 9000 to public networks, and do not bind to `0.0.0.0` casually. The console at port 9001 remains loopback-only. If the PC's LAN IP changes, update both environment files and the firewall rule.

## 3. Install the Express storage adapter dependencies

From `C:\Users\User\dev\test\src\express-test`:

```powershell
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
npx tsc --noEmit
```

The adapter is deliberately **not instantiated at import time**. Register it from your existing `src/main/container.ts` after the project's environment loader has initialized `process.env`:

```ts
import { MinioObjectStorage } from "../infrastructure/storage/minio/MinioObjectStorage";

const objectStorage = MinioObjectStorage.fromEnvironment();
```

Then inject `objectStorage` into the application service that needs file storage. Keep storage keys opaque (for example, use generated UUIDs); do not place a patient's name, email address, or other direct identifier in an object key. Keep uploaded therapy audio private and give clients short-lived presigned URLs only when the API authorizes access.

The adapter uses `forcePathStyle: true`, which is appropriate for an S3-compatible local endpoint, and presigned URLs are limited to 30–900 seconds. See the AWS SDK v3 S3 client docs for its `S3Client` and request-presigner API: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-s3/Class/S3Client and https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-s3-request-presigner/.

## 4. Wire account setup preference persistence

The current Expo setup form sends this body to `PUT /api/v1/account/setup`:

```json
{
  "displayName": "A display name",
  "preferredLanguage": "en-MY",
  "accessibilityPreferences": {
    "textSize": "medium",
    "contrast": "normal",
    "alternativeInputOn": false
  },
  "voicePreferences": {
    "preferredVoiceId": null,
    "audioRate": 1,
    "audioVolume": 1,
    "voiceDisabled": false
  }
}
```

Make these three small changes in the existing implementation:

1. In `src/main/http/validators/accountSetupSchema.ts`, validate the full body with `parseAccountSetupPreferences` from `application/account-setup/accountSetupPreferences.ts` (or merge its checks into the validator you already use). Validation is needed because JSON from a client is untrusted.
2. Extend the existing `CompleteAccountSetup` input/domain application command to carry `accessibilityPreferences` and `voicePreferences` along with the already-supported `displayName` and `preferredLanguage`.
3. In `PgAccountRepository.ts`, add the call to `writeAccountSetupPreferences(client, internalUserId, input)` **inside the same PostgreSQL transaction** that currently updates the corresponding `users` row. Import it from `./AccountSetupPreferencesWriter` relative to the PostgreSQL folder. Use the backend's resolved internal `users.id` UUID; never trust a client-supplied ID and never use the raw Auth0 `sub` as `user_id`. If either preference upsert fails, roll back the transaction.

Your existing setup use case/repository should continue to be responsible for the `users.display_name`, `preferred_language`, `status`, and `setup_completed_at` values. Auth0 is the source of authentication and verified email claims; the client does not get to set email verification, user status, UUIDs, roles, or timestamps. The preference writer intentionally touches only `accessibility_preferences` and `voice_preferences`.

A useful transaction shape in the repository is:

```ts
const client = await pool.connect();
try {
  await client.query("BEGIN");
  // Existing users row update and existing setup checks go here.
  await writeAccountSetupPreferences(client, internalUserId, input);
  await client.query("COMMIT");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
}
```

Do not add a second nested transaction if your repository already opens one. Use its existing `PoolClient` and transaction flow.

## 5. Check and smoke-test

Run the backend typecheck after the new SDK dependencies are installed:

```powershell
cd C:\Users\User\dev\test\src\express-test
npx tsc --noEmit
```

Then start the API normally and test sign-up/account setup. Query the persisted values using your database client, replacing the UUID with the account's internal database ID:

```sql
SELECT display_name, preferred_language, status, setup_completed_at
FROM users
WHERE id = '<internal-user-uuid>';

SELECT text_size, contrast, alternative_input_on, updated_at
FROM accessibility_preferences
WHERE user_id = '<internal-user-uuid>';

SELECT preferred_voice_id, audio_rate, audio_volume, voice_disabled, updated_at
FROM voice_preferences
WHERE user_id = '<internal-user-uuid>';
```

Check that a second save updates the same two preference rows instead of creating duplicates. Also check invalid values (for example audio rate `5`) are rejected with HTTP 400 and do not partially update data.

## Operational note

The `minio/minio` upstream repository was archived in April 2026, and its README says legacy prebuilt binary releases are no longer maintained: https://github.com/minio/minio. To make local Docker setup practical, the Compose file uses a community-built image at the upstream `RELEASE.2025-10-15T17-29-55Z` source tag, published by `golithus/minio-builds`; it is not an official first-party current MinIO image. This is a local development baseline only. Before using it for real patient audio or production, choose and verify a maintained S3-compatible service/build, pin a verified image digest, configure TLS/secrets management/backups, and define retention/deletion controls. Local development data is not a backup.
