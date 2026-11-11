FROM postgres:16-alpine

# First-boot SQL only. PostgreSQL executes these files, in filename order,
# only when PGDATA is empty. Do not copy migrations/ here as well: the
# existing 003_training_content.sql would be executed twice.
COPY init/ /docker-entrypoint-initdb.d/

COPY config/postgresql.conf /etc/postgresql/postgresql.conf

CMD ["postgres", "-c", "config_file=/etc/postgresql/postgresql.conf"]
