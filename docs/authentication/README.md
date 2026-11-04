# MDATE first-party authentication

MDATE now owns credentials and sessions inside the Express modular monolith. Auth0 is not part of the runtime authentication flow.

## Runtime flow

1. Expo sends email/password to `POST /api/v1/auth/register` or `/login` over HTTPS.
2. Express validates input, hashes passwords with bcryptjs, and persists the user in PostgreSQL.
3. Registration assigns the default `patient` role in the same transaction as the user insert.
4. Express issues a short-lived HS256 access JWT (`sub = users.id`) and an opaque refresh token.
5. Native clients store refresh tokens with `expo-secure-store`. Web clients receive a HttpOnly refresh cookie; the cookie is never exposed to JavaScript.
6. Protected routes validate the JWT and resolve the current MDATE account from PostgreSQL. Current account status and roles are not trusted from client-supplied data.

## API

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/auth/register` | Register and create a session |
| POST | `/api/v1/auth/login` | Sign in and create a session |
| POST | `/api/v1/auth/refresh` | Rotate the refresh token and return a new access token |
| POST | `/api/v1/auth/logout` | Revoke the current refresh token |
| POST | `/api/v1/auth/password-reset/request` | Request a reset link |
| POST | `/api/v1/auth/password-reset/confirm` | Consume a reset link and change password |
| GET | `/api/v1/me` | Return current authenticated account |
| PUT | `/api/v1/account/setup` | Complete profile and preferences |

`/api/v1/modules`, module details, Q_Sets and speech endpoints require an active, set-up user. `/api/v1/me` and account setup accept a `PENDING_SETUP` account.

## Password policy

Passwords must be at least 12 characters and at most 72 UTF-8 bytes. The upper byte limit is required by bcrypt. The implementation uses bcrypt cost 12. Passwords and raw refresh/reset tokens are never stored in PostgreSQL.

## Environment

Copy `src/express-test/.env.example` to `src/express-test/.env` and set:

- `DATABASE_URL` to the database reachable from the Express process.
- `JWT_ACCESS_SECRET` to a random secret of at least 32 characters. Generate one with `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"`.
- `EXPO_WEB_ORIGIN` to the exact Expo Web origin.
- SMTP settings before enabling production password-reset email. During development, reset links are printed to the Express console.

Copy `src/expo-test/.env.example` to `src/expo-test/.env`. The native URL must use the Windows PC LAN IP when testing from the physical tablet/phone. Do not set the native API URL to `localhost` on a separate device.

## Web cookies and HTTPS

The web refresh cookie is HttpOnly, SameSite=Lax, scoped to `/api/v1/auth`, and Secure in production. Web API requests use `credentials: include`; Express CORS uses an explicit origin and `credentials: true`. The configured frontend and API should be same-site for SameSite=Lax. Use HTTPS for production and do not weaken cookie flags to work around a deployment-domain mismatch.

## Database migration and existing accounts

Back up the PostgreSQL database first. From the repository root, apply the forward migration through the existing Docker PostgreSQL container (the repository's development container is named `postgres`):

```powershell
Get-Content -Raw .\infra\postgres\migrations\004_local_identity.sql | docker exec -i postgres psql -U YOUR_DB_USER -d YOUR_DB_NAME
```

Replace `YOUR_DB_USER` and `YOUR_DB_NAME` with the values from your project-root `.env`. This streams the migration into the container and does not require a local `psql` installation.

Ensure the default `patient` role exists before testing registration. For an existing database where it is missing, run this once using the same container/user/database values:

```powershell
docker exec postgres psql -U YOUR_DB_USER -d YOUR_DB_NAME -c "INSERT INTO roles (name, description) VALUES ('patient', 'Default role for MDATE patients') ON CONFLICT (name) DO NOTHING;"
```

The migration adds `password_hash`, `refresh_sessions`, and `password_reset_tokens` without dropping or recreating `users`, changing user UUIDs, or touching their role/profile/training foreign keys. It normalizes existing email addresses before creating a case-insensitive unique index. Check for duplicates first using the query below; resolve duplicates deliberately rather than merging accounts automatically.

Before applying the migration, check for existing duplicate email addresses because the new case-insensitive unique index will reject them:

```sql
SELECT lower(btrim(email)) AS normalized_email, count(*)
FROM users
WHERE email IS NOT NULL AND deleted_at IS NULL
GROUP BY lower(email)
HAVING count(*) > 1;
```

Existing Auth0-linked users retain their MDATE UUID and related data, but no password can be imported from Auth0. If their email is already stored in `users.email`, they can use the password-reset flow to establish a new local password. Accounts with no stored email require an administrator-assisted email update before password recovery. In development, request reset and copy the one-time URL printed by Express. In production, configure SMTP. `email_verified` remains false unless a separate MDATE email-verification workflow is implemented; the current app does not block access on this flag.

The old `oauth_providers` table is deliberately left unused by this migration so existing data is not destroyed during cutover. Once the rollout is verified and no rollback to Auth0 is required, remove that legacy table in a separately reviewed cleanup migration.

## Install and run

From `src/express-test`:

```powershell
npm install
npm run typecheck
npm run build
npm run dev
```

From `src/expo-test`:

```powershell
npx expo install expo-secure-store
npm install
npx tsc --noEmit
npx expo start --web --port 8081 --clear
```

Rebuild the native development client after adding SecureStore. Do not use `npm ci` until the lockfile has been regenerated by `npm install`.

## Verification checklist

- Register a new patient; confirm one `users` row and one patient `user_roles` row are created.
- Confirm password hashes start with a bcrypt prefix and never equal the submitted password.
- Sign in with correct credentials; wrong credentials return a generic 401.
- Confirm no access token is placed in persistent client storage.
- Confirm native refresh token is in SecureStore; web refresh token is an HttpOnly cookie.
- Refresh twice and verify the previous refresh token cannot be reused; reuse should revoke the token family.
- Logout and verify refresh fails.
- Verify expired/invalid access JWTs are rejected.
- Verify PENDING_SETUP users can access `/me` and account setup but cannot access training/speech endpoints.
- Verify SUSPENDED/DELETED users cannot access protected APIs.
- Verify roles come from PostgreSQL, never from registration input.
- Request password reset, consume the link once, verify it expires, and verify all existing sessions are revoked after reset.
- Verify existing `users.id`, `user_roles`, preference rows and training foreign keys remain unchanged.
