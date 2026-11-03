FROM postgres:16-alpine

# Copy first-time database initialization scripts.
# The official PostgreSQL entrypoint runs these in filename order when
# PGDATA is empty, so 001 -> 002 -> 003 preserves dependency order.
COPY init/ /docker-entrypoint-initdb.d/
COPY migrations/ /docker-entrypoint-initdb.d/

# Copy custom postgresql.conf
COPY config/postgresql.conf /etc/postgresql/postgresql.conf

CMD ["postgres", "-c", "config_file=/etc/postgresql/postgresql.conf"]
