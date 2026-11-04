# MDATE local identity overlay

This overlay replaces Auth0 with first-party authentication in `src/express-test` and `src/expo-test`.

## Apply to repository root

1. Stop Express and Expo.
2. Back up the repository and PostgreSQL database.
3. Extract this ZIP into the repository root, preserving the folder paths and allowing the files to merge/replace.
4. Open `docs/authentication/README.md` and apply the PostgreSQL migration using the existing Docker PostgreSQL container.
5. Update local `.env` files from the supplied `.env.example` files. Generate a new `JWT_ACCESS_SECRET`; never commit it.
6. Run `npm install` in both `src/express-test` and `src/expo-test` to regenerate their lockfiles. The package manifests remove Auth0 and add the new dependencies.
7. Run the backend and frontend checks in the documentation.

## Important scope notes

- This is a source overlay, not a commit to GitHub. It does not modify your repository until you merge it.
- Existing MDATE user UUIDs and account data are preserved. Existing Auth0 passwords cannot be migrated; users must establish local passwords via reset.
- Password-reset email sends through SMTP when configured. In development without SMTP, the reset link is printed in the Express console.
- `expo-secure-store` stores native refresh tokens. The web refresh token uses a HttpOnly cookie. Web and native use the same login/register endpoints.
- The old `oauth_providers` table is retained but is no longer used. Drop it only after validating the migration and deciding that rollback to Auth0 is no longer needed.
- Check your existing `.env` values before replacing them. The example files are templates, not production secrets.

## Remove obsolete Auth0-only files

A ZIP can replace/add files but cannot delete tracked files. The obsolete TypeScript paths are overwritten by temporary local-auth shims so the project remains buildable during cutover. Follow `DELETE-AFTER-MERGE.txt` after merging to delete those shims and the old Auth0 Action file once no references remain. Keep `AuthFlowProvider.tsx` temporarily as a compatibility alias for remaining Expo screens that still call `useAuthFlow()`; it delegates to `useAuth()` and has no Auth0 dependency.
