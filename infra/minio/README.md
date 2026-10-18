# MDATE object storage

For local development, MinIO is defined in `docker/compose/compose.minio.yaml` and persistent object data is stored in the Docker named volume `mdate-minio-data`. Three private buckets are initialized: `mdate-audio`, `mdate-assets`, and `mdate-exports`.

The Express process should use the dedicated `MINIO_APP_USER` / `MINIO_APP_PASSWORD` credentials. Do not expose root credentials to Expo or send patient audio through public bucket policies. Use server-authorized, short-lived presigned URLs if direct upload/download is needed.

This is not a production deployment recipe. Review upstream maintenance status, TLS, backup/restore, encryption, retention/deletion, access audit, and regional health-data obligations before storing real patient audio.
