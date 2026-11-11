# Obtain the maintained MinIO-compatible client
FROM docker.io/pgsty/mc:RELEASE.2026-11-09T00-00-00Z AS mc

# Provide a shell for the initialization script
FROM alpine:3.22

RUN apk add --no-cache ca-certificates

COPY --from=mc /usr/bin/mc /usr/local/bin/mc
