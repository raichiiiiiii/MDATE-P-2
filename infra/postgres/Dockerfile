FROM postgres:16-alpine

# Copy initialization scripts
COPY init/ /docker-entrypoint-initdb.d/

# Copy custom postgresql.conf
COPY config/postgresql.conf /etc/postgresql/postgresql.conf

CMD ["postgres", "-c", "config_file=/etc/postgresql/postgresql.conf"]
