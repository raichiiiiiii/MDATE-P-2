MDATE — Dynamic browser-origin validation overlay

Purpose
-------
Fixes HTTP 403 "This browser origin is not allowed" when a Cloudflare Quick
Tunnel hostname changes. The API no longer compares every browser Origin to a
single fixed EXPO_WEB_ORIGIN value. It compares the browser Origin to the
request's Host and externally visible protocol.

Files to merge
--------------
src/express-test/src/main/http/middleware/requireAllowedOrigin.ts
src/express-test/src/main/http/middleware/requireAllowedOrigin.test.ts
src/express-test/package.json
src/express-test/.env.example

Merge
-----
1. Extract this ZIP into the repository root.
2. Allow the listed files to overwrite existing files.
3. Keep your root .env unchanged. No new root .env setting is required.
4. Recreate the backend so it loads the new middleware:

   docker compose --env-file .env -f docker/compose/compose.yaml up -d --build --force-recreate backend

5. Check backend startup:

   docker compose --env-file .env -f docker/compose/compose.yaml logs --tail 100 backend

6. Test the public API health route:

   curl.exe -i https://YOUR-QUICK-TUNNEL.trycloudflare.com/health

7. Test an authentication endpoint. A 400/401 response may be expected based
   on payload/session; the specific "origin_not_allowed" 403 should disappear.

Run regression tests from src/express-test:

   npm run test:origin
   npm run typecheck

Technical notes
---------------
- Local HTTP works when Nginx forwards no X-Forwarded-Proto; Express falls
  back to its direct HTTP protocol.
- Cloudflare documents that it sets X-Forwarded-Proto to the visitor's original
  HTTP/HTTPS scheme. The existing Nginx template forwards this header to Express.
- The backend is not host-published in Compose, so browser requests reach it
  through Nginx. Do not publish the backend port directly.
- Requests without an Origin header (such as native clients) continue through
  this middleware; authentication/authorization remains enforced separately.
- The global Express CORS policy still uses EXPO_WEB_ORIGIN for any explicitly
  cross-origin integrations. Same-origin browser API calls do not require CORS.
- This overlay does not change MinIO CORS, presigned storage URLs, Nginx routing,
  Cloudflare TLS, database volumes, or application data.

Trust boundary
--------------
The comparison depends on Host and X-Forwarded-Proto being supplied by the
trusted Nginx proxy path. Keep Express accessible only on the internal Docker
network. The current Nginx configuration preserves Host and forwards the
Cloudflare-provided X-Forwarded-Proto header.
