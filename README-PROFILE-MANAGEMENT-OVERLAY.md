# MDATE Profile Management Overlay

This is a mergeable source overlay for `raichiiiiiii/MDATE-P-2` based on the repository's `main` branch inspected on 5 November 2026.

It implements the approved scope:

- Presigned avatar upload to the private MinIO `mdate-assets` bucket.
- Profile display-name editing and avatar removal.
- Email-change request and one-time email verification.
- Current-password verification and password change.
- Listing and revoking session families, including signing out other sessions.
- Dashboard profile-image navigation to a separate Profile screen.

The archive preserves the repository directory structure. Extract it into the repository root and allow the included files to overwrite their existing counterparts. Back up your working tree first and inspect the diff before running the migration.

## 1. Merge

1. Commit or back up your current work.
2. Extract the ZIP into the MDATE repository root.
3. Review the overwritten files with `git status` and `git diff`.
4. Keep your existing `.env` files. Copy the new variable names from `src/express-test/.env.example` into your existing `src/express-test/.env`; do not replace database credentials, JWT secrets, SMTP credentials or other local settings.

The overlay changes the following existing areas:

- Express app/container, auth middleware, auth routes, identity token issuance and identity repository.
- MinIO storage interface and adapter.
- Expo root/main navigation, AuthProvider, account type, dashboard screen/header and app config.
- MinIO standalone Compose initialization, to apply the asset-bucket CORS policy needed by Expo Web.

## 2. Install Expo image picker

From `src/expo-test`:

```powershell
npx expo install expo-image-picker
```

The overlay adds the Expo config plugin and image-picker UI code. Run `expo install` so the installed package version matches the Expo SDK in this repository.

## 3. Configure MinIO

The repository already has a standalone MinIO Compose file and an initialization script. The updated initialization script also applies a CORS policy to `mdate-assets` for the configured Expo Web origin.

Add these values to the **repository-root** `.env` file used by Docker Compose. Use newly generated credentials; do not reuse the MinIO root password as the application password.

```dotenv
MINIO_ROOT_USER=replace_with_minio_admin_user
MINIO_ROOT_PASSWORD=replace_with_a_long_random_root_password
MINIO_APP_USER=replace_with_mdate_app_user
MINIO_APP_PASSWORD=replace_with_a_different_long_random_password
MINIO_BIND_ADDRESS=127.0.0.1
EXPO_WEB_ORIGIN=http://localhost:8081
```

For a browser running on the same PC, `127.0.0.1` is sufficient. For a **physical tablet** uploading directly to MinIO, the MinIO host must be reachable from the tablet. In that case:

- Set `MINIO_BIND_ADDRESS=0.0.0.0` in the Compose `.env` so the host binds to its network interfaces.
- Restrict access to port 9000 using the Windows firewall and trusted LAN; do not expose MinIO publicly.
- Set the API's `MINIO_ENDPOINT` to the PC's LAN IP and port 9000, not `localhost`.
- Use the correct Expo Web origin in `EXPO_WEB_ORIGIN` if testing Expo Web from another device. Native Expo clients do not enforce browser CORS, but they still need network access to the endpoint.

Start MinIO from the repository root:

```powershell
docker compose --env-file .env -f docker/compose/compose.minio.yaml up -d
```

If MinIO already exists and the `minio-init` service has already exited successfully, recreate that one-time initializer to apply the new CORS configuration and credentials:

```powershell
docker compose --env-file .env -f docker/compose/compose.minio.yaml up -d --force-recreate minio-init
```

The initializer creates private buckets and a restricted application identity. The Express process must use `MINIO_APP_USER` and `MINIO_APP_PASSWORD`, never the root credentials.

### Express environment

Add the following to `src/express-test/.env`:

```dotenv
EMAIL_CHANGE_BASE_URL=http://localhost:8081/confirm-email-change
MINIO_ENDPOINT=http://localhost:9000
MINIO_APP_USER=the_same_MINIO_APP_USER_from_root_env
MINIO_APP_PASSWORD=the_same_MINIO_APP_PASSWORD_from_root_env
MINIO_REGION=us-east-1
MINIO_BUCKET_ASSETS=mdate-assets
MINIO_PRESIGNED_URL_TTL_SECONDS=300
```

When uploading from the tablet, replace `MINIO_ENDPOINT` and the email-change link host with an address reachable from that device, such as `http://192.168.1.20:9000` and `http://192.168.1.20:8081/confirm-email-change`. The exact address depends on your PC's LAN configuration.

If MinIO credentials are absent, Express still starts and profile editing remains available. Avatar uploads return `503 avatar_storage_unavailable`; removing an avatar still clears its database reference, but a stored private object cannot be deleted until MinIO is reachable. The API deliberately does not fall back to permanent local Express file storage.

Email verification and password-reset links are written to the Express console in development when SMTP is not configured. Production email changes require the existing SMTP variables to be configured.

## 4. Apply PostgreSQL migration

Back up the database first. Apply this migration once against the same PostgreSQL database used by `src/express-test`.

From the repository root in PowerShell, using your actual DB user and DB name:

```powershell
Get-Content -Raw .\infra\postgres\migrations\005_account_management.sql | docker exec -i postgres psql -U YOUR_DB_USER -d YOUR_DB_NAME
```

This migration is additive. It does not recreate `users`, change user UUIDs, or alter training/preferences foreign keys. It adds avatar metadata to `users`, upload-intent records, and pending email-change records.

The `users` table and local-identity tables must already exist. Apply the existing identity migration first if this is a fresh or not-yet-migrated database.

## 5. Build and run

Express, from `src/express-test`:

```powershell
npm install
npm run typecheck
npm run build
npm run dev
```

Expo, from `src/expo-test`:

```powershell
npx expo install expo-image-picker
npx tsc --noEmit
npx expo start --web --port 8081 --clear
```

For a physical tablet, ensure `EXPO_PUBLIC_API_URL_NATIVE` points to the PC's LAN IP and the tablet can reach both the Express API and MinIO. A successful Express upload-ticket response does not prove the tablet can reach MinIO; the actual presigned PUT must succeed too.

## 6. API endpoints added

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/v1/me/profile` | Current profile and short-lived avatar URL |
| `PATCH` | `/api/v1/me/profile` | Update display name |
| `POST` | `/api/v1/me/profile/avatar/upload-url` | Create a presigned avatar upload ticket |
| `POST` | `/api/v1/me/profile/avatar/confirm` | Validate the uploaded image and activate it |
| `DELETE` | `/api/v1/me/profile/avatar` | Remove avatar metadata and stored object |
| `POST` | `/api/v1/me/email-change/request` | Verify current password and send a new-address verification link |
| `POST` | `/api/v1/auth/email-change/confirm` | Consume the email verification token |
| `POST` | `/api/v1/me/password/change` | Change password after current-password verification |
| `GET` | `/api/v1/me/sessions` | List active refresh-token families |
| `DELETE` | `/api/v1/me/sessions/:sessionId` | Revoke one session family |
| `POST` | `/api/v1/me/sessions/revoke-others` | Revoke all sessions except the current one |

## 7. Verification checklist

1. Complete first-time account setup, then open Profile by pressing the dashboard picture.
2. Change the display name and verify the dashboard greeting updates.
3. Upload JPEG, PNG and WebP images under 2 MB. Verify that the uploaded avatar appears after refresh.
4. Try an image over 2 MB and a renamed non-image file; both must be rejected.
5. Remove the avatar and verify the placeholder returns.
6. Request an email change with the correct current password. Verify the email remains unchanged until the link is consumed.
7. Consume the link once, verify `users.email` and `email_verified`, then try the link again and confirm it is rejected.
8. Request a password change with an incorrect current password; it must fail. Change it with the correct password and verify that other sessions are revoked while the current session remains usable.
9. Sign in from a second client, list sessions, revoke that session, and verify its protected API requests receive an authentication error.
10. Verify the existing account-setup screen, accessibility/voice preferences, training routes and logout still work.

## Implementation notes and limitations

- Access JWTs now contain a session-family (`sid`) claim. Protected API requests check that family in PostgreSQL so revocation invalidates already-issued access tokens as well as refresh credentials. Access tokens issued before this change do not contain `sid`; the client should refresh its session once after deployment. If refresh credentials have already expired, sign in again.
- Session records currently expose start, last-refresh and expiry times. Device model and user-agent labels are intentionally not shown because the current schema does not capture reliable device metadata.
- Avatar content is checked against JPEG/PNG/WebP file signatures and the 2 MB limit before activation. This overlay does not re-encode images or remove EXIF metadata. Add a trusted image-processing step before using profile photos in a production healthcare deployment.
- Failed or abandoned upload intents can leave unreferenced objects in MinIO. The active avatar is always selected through PostgreSQL; plan a periodic cleanup task for expired intents and orphaned `avatars/` objects before production.
- Presigned URL creation and server-side verification require `MINIO_ENDPOINT` to resolve from Express. The URL returned to Expo must also resolve from the device performing the upload.
- This overlay was syntax-checked, but it was not built against your local `node_modules`, live PostgreSQL database or MinIO instance. Run the typecheck/build and verification steps above in your working copy before merging.
