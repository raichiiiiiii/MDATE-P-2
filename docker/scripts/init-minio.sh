#!/bin/sh
set -eu

# Wait for MinIO to become reachable. Keep retries finite so misconfiguration
# produces a visible failure rather than an endless restart loop.
tries=0
until mc alias set mdate http://minio:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null 2>&1; do
  tries=$((tries + 1))
  if [ "$tries" -ge 60 ]; then
    echo "MinIO did not become ready within 120 seconds." >&2
    exit 1
  fi
  sleep 2
done

mc mb --ignore-existing mdate/mdate-audio
mc mb --ignore-existing mdate/mdate-assets
mc mb --ignore-existing mdate/mdate-exports

# Make a dedicated backend identity that cannot administer MinIO. Policy access
# is limited to the three MDATE buckets.
cat > /tmp/mdate-app-policy.json <<'POLICY'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket", "s3:ListBucketMultipartUploads"],
      "Resource": [
        "arn:aws:s3:::mdate-audio",
        "arn:aws:s3:::mdate-assets",
        "arn:aws:s3:::mdate-exports"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:AbortMultipartUpload",
        "s3:ListMultipartUploadParts"
      ],
      "Resource": [
        "arn:aws:s3:::mdate-audio/*",
        "arn:aws:s3:::mdate-assets/*",
        "arn:aws:s3:::mdate-exports/*"
      ]
    }
  ]
}
POLICY

# Policy creation and user creation are idempotent for repeated init runs.
mc admin policy create mdate mdate-app-bucket-access /tmp/mdate-app-policy.json >/dev/null 2>&1 || true
mc admin user add mdate "$MINIO_APP_USER" "$MINIO_APP_PASSWORD" >/dev/null 2>&1 || true
mc admin policy attach mdate mdate-app-bucket-access --user "$MINIO_APP_USER"

echo "MDATE MinIO initialization complete: mdate-audio, mdate-assets, mdate-exports."
