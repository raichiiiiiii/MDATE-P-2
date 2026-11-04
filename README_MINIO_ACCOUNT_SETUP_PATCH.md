# MDATE Express + MinIO integration notes

This historical overlay adds MinIO storage support and account-setup preference persistence. It remains separate from authentication: the current Express implementation uses MDATE's first-party JWT identity service, not an external identity provider.

- Configure MinIO root and application credentials in the project `.env` files; the application must use the limited MinIO app identity, not the root credentials.
- Keep the three buckets private (`mdate-audio`, `mdate-assets`, `mdate-exports`). Use short-lived presigned URLs only after the backend authorizes the user and asset.
- Store opaque UUID-based object keys; do not put patient names or email addresses in object keys.
- Account setup persists `display_name`, `preferred_language`, accessibility preferences, and voice preferences through the Express account repository in one PostgreSQL transaction.
- The authenticated user identity is `res.locals.userId` / the internal `users.id` UUID supplied by the local JWT middleware. Never accept a client-supplied user UUID, role, account status, or email-verification flag.

See `docs/authentication/README.md` for local identity environment setup and `README-AUTH-OVERLAY.md` for the migration workflow.
