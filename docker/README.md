# MDATE Docker development overlay

This overlay targets repository `raichiiiiiii/MDATE-P-2`, branch `main`.

It keeps the repository's current application locations (`src/expo-test` and `src/express-test`) and provides a development stack with hot reload.

## Services and traffic flow

```text
Browser / Android tablet
        |
        v
Nginx :80  <---- Cloudflare Tunnel (optional profile; TLS at Cloudflare edge)
   |       |\\
   |       | \\-- storage hostname --> MinIO :9000 (S3 presigned URLs)
   |       \\---- /api/* -----------> Express :3000
   \\------------ / ---------------> Expo web / Metro :8081

Express ---> PostgreSQL :5432
       \\----> Redis :6379 (container only; API integration is not present yet)
       \\----> MinIO :9000 (internal S3 operations)
       \\----> local Python Whisper worker + FFmpeg
```

Only Nginx is the application HTTP entrypoint. Expo Metro is separately published on the LAN during development because the physical tablet needs to fetch the native JavaScript bundle. PostgreSQL and the MinIO console are loopback-only; Redis and Express have no host-published ports. The MinIO S3 port is published on the LAN for local presigned uploads.

## 1. Merge the overlay

Extract the ZIP into the repository root and allow files to merge/overwrite. It does not move or replace the existing application directories. The overlay deliberately excludes `.env`, model weights, recordings, and database data.

## 2. Prepare the environment

From the repository root in PowerShell:

```powershell
Copy-Item .env.example .env
```

Edit `.env` before starting:

- Set `LOCAL_IP` to the Windows PC's LAN IPv4 address (use `ipconfig`).
- Set `NATIVE_API_ORIGIN` to `http://<LOCAL_IP>:8080` so the Android tablet calls the PC's Nginx proxy, not its own `localhost`.
- Replace `POSTGRES_PASSWORD`, `JWT_ACCESS_SECRET`, `MINIO_ROOT_PASSWORD`, and `MINIO_APP_PASSWORD` with private values. Use URL-safe letters/numbers/underscore/hyphen in `POSTGRES_PASSWORD` because it is embedded in `DATABASE_URL`.
- For local development, keep `APP_PUBLIC_ORIGIN=http://localhost:8080` and set `MINIO_PUBLIC_ENDPOINT=http://<LOCAL_IP>:9000`.
- For Cloudflare access, set `APP_HOSTNAME` and `STORAGE_HOSTNAME` to the two Cloudflare hostnames, `APP_PUBLIC_ORIGIN=https://<app-hostname>`, and `MINIO_PUBLIC_ENDPOINT=https://<storage-hostname>`.
- MinIO's server-wide CORS allowlist defaults to `APP_PUBLIC_ORIGIN`. Set `MINIO_CORS_ALLOWED_ORIGINS` only when the web app must be served from multiple browser origins; use a comma-separated list. Include the app's origin, not the storage hostname.

Generate a JWT secret in PowerShell with:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Do not commit `.env`.

## 3. Prepare the local Whisper checkpoint

The checkpoint is not in Git and is not included in this ZIP. Place the complete fine-tuned Transformers checkpoint under:

```text
src/express-test/models/whisper-aphasia/
```

It must include `config.json`, model weights, processor/tokenizer files, and feature-extractor configuration. The backend container mounts this directory read-only at `/models/whisper-aphasia`. The Python worker uses local files only; it will not download or fall back to a generic Whisper model.

The backend image installs FFmpeg, CPU PyTorch, and the ML requirements in `requirements-ml.txt`. The Python worker remains a subprocess of Express, consistent with the current implementation.

## 4. Start the local development stack

```powershell
.\docker\scripts\start-dev.ps1
```

The first build downloads Node/Python packages and the CPU PyTorch wheel. Subsequent starts reuse Docker's build and dependency caches. The new Compose project uses fresh, explicitly named volumes (`mdate-dev-*`); old volumes from earlier Compose files are not automatically reused or deleted.

Useful addresses:

| Service | Address |
|---|---|
| Web app through Nginx | `http://localhost:8080` |
| Express health through Nginx | `http://localhost:8080/health` |
| Expo Metro (LAN/dev client) | `http://<LOCAL_IP>:8081` |
| PostgreSQL from Windows | `localhost:5432` |
| MinIO API | `http://<LOCAL_IP>:9000` |
| MinIO console | `http://localhost:9001` |

Use the MinIO application credentials from `.env` in the backend. The MinIO root credentials are for administration only.

## 5. Enable Cloudflare Tunnel

Create a Cloudflare Tunnel and set its token in `.env` as `CLOUDFLARE_TUNNEL_TOKEN`. In the Cloudflare dashboard, configure **both** public hostnames to use the same origin service `http://proxy:80`:

- `APP_HOSTNAME` (for example `app.example.com`)
- `STORAGE_HOSTNAME` (for example `storage.example.com`)

Set the corresponding `.env` values described in section 2, then start:

```powershell
.\docker\scripts\start-dev.ps1 -WithTunnel
```

Cloudflare handles public TLS. Nginx listens on HTTP inside the Docker network; this configuration does not publish host port 443 and does not run Certbot. Do not point the Cloudflare hostname directly at Expo or Express; the tunnel origin should be `http://proxy:80`.

## 6. Verify the stack

```powershell
docker compose --env-file .env -f docker/compose/compose.yaml ps
docker compose --env-file .env -f docker/compose/compose.yaml logs -f backend
```

Check `http://localhost:8080/health`. To test from a tablet, use the PC LAN IP and ensure Windows Defender Firewall permits the development ports 8080, 8081, and 9000 on the private network. Do not create router port-forwarding rules for these development ports.

## 7. Stop and reset

Stop without deleting data:

```powershell
.\docker\scripts\stop-dev.ps1
```

To remove this Compose project's development volumes and start with an empty PostgreSQL and MinIO data store, run:

```powershell
.\docker\scripts\reset-dev-data.ps1
```

That reset is destructive. It removes the volumes named by this overlay. It does not delete old volumes left behind by previous Compose project names.

## Important implementation notes

- PostgreSQL's official entrypoint runs `infra/postgres/init/*.sql` only when `PGDATA` is empty. The modified PostgreSQL Dockerfile copies the init directory only; it does not also copy the duplicate `migrations/003_training_content.sql` into the entrypoint and accidentally run the training schema twice. Later migrations should be applied deliberately, not by rebuilding the image.
- The fresh volume contains a fresh schema, but it does not seed published therapy modules unless the current SQL initialization files provide that seed. Schema initialization and content seeding are separate concerns.
- Redis starts with both RDB snapshots and AOF disabled. The current Express code does not yet connect to Redis, so this overlay does not claim Redis-backed caching/idempotency is active.
- The MinIO adapter uses `MINIO_ENDPOINT` for server-to-server traffic and `MINIO_PUBLIC_ENDPOINT` for URLs signed for browsers/tablets. This is necessary because a client device cannot resolve the Docker-only hostname `minio`.
- MinIO Community Edition uses server-wide CORS configured by `MINIO_API_CORS_ALLOW_ORIGIN`; bucket-level CORS initialization is intentionally omitted. Change `MINIO_CORS_ALLOWED_ORIGINS` or `APP_PUBLIC_ORIGIN` and recreate/restart the MinIO container for the new allowlist to take effect.
- Expo web calls the same origin as the page (`APP_PUBLIC_ORIGIN`); Nginx forwards `/api/*` without stripping `/api`. Native clients use `NATIVE_API_ORIGIN`.
- Nginx and the Cloudflare Tunnel are development infrastructure, not a production security boundary. Do not expose the development stack to the public internet with a production patient dataset.
