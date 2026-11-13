MDATE — SAME-ORIGIN API / CLOUDFLARE QUICK TUNNEL FIX
====================================================

PURPOSE
-------
Fixes web API requests that incorrectly target http://localhost:8080 when the
application is opened through a public Cloudflare hostname such as
https://<random-name>.trycloudflare.com.

WHAT CHANGED
------------
1. src/expo-test/src/features/auth/apiClient.ts
   - Web API requests now use window.location.origin.
   - Native API requests continue to use EXPO_PUBLIC_API_URL_NATIVE.

2. src/expo-test/src/features/training/trainingApi.ts
   - Training API now reuses the shared API URL resolver.
   - Auth, training, speech, and relative training-media requests therefore use
     the same active origin on web.

3. src/expo-test/.env.example
   - Removes the obsolete EXPO_PUBLIC_API_URL_WEB setting.
   - Documents the native API URL setting.

MERGE
-----
Extract this ZIP into the MDATE-P-2 repository root and allow the three files
to merge/overwrite. No .env file, credentials, database data, MinIO data, or
model weights are included.

RESTART FRONTEND
----------------
From the repository root in PowerShell:

docker compose --env-file .env -f docker/compose/compose.yaml up -d --build --force-recreate frontend

The code is bind-mounted, but recreating the frontend also ensures Expo picks
up the new runtime configuration and clears the old process environment.

TEST
----
1. Local frontend:
   http://localhost:8080

2. Public Quick Tunnel frontend:
   https://<your-current-name>.trycloudflare.com

3. Test the backend directly through each host:
   http://localhost:8080/health
   https://<your-current-name>.trycloudflare.com/health

4. In browser Developer Tools > Network, inspect an API call such as
   /api/v1/auth/refresh or /api/v1/me. The Request URL should start with the
   same origin as the page. For the Quick Tunnel it should begin with
   https://<your-current-name>.trycloudflare.com/api/...
   It must not point to http://localhost:8080.

IMPORTANT
---------
- Browse the web app through Nginx (localhost:8080 or the public Tunnel URL).
  Do not use the direct Expo web/Metro port 8081 as the application URL; that
  port does not proxy /api to Express.
- Nginx and Cloudflare Tunnel configuration are unchanged. No local TLS
  certificate or Nginx HTTPS listener is required for Cloudflare edge TLS.
- This fix addresses API requests. Public MinIO presigned upload/download URLs
  are a separate concern: if MINIO_PUBLIC_ENDPOINT still points to a private
  LAN address, remote users may still be unable to upload or download objects.
