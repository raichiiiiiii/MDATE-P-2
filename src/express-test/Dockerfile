FROM node:24-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg python3 python3-venv ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY requirements-ml.txt /tmp/requirements-ml.txt
RUN python3 -m venv /opt/md-venv \
    && /opt/md-venv/bin/pip install --upgrade pip \
    && /opt/md-venv/bin/pip install --index-url https://download.pytorch.org/whl/cpu torch==2.8.0 \
    && /opt/md-venv/bin/pip install -r /tmp/requirements-ml.txt

ENV PATH="/opt/md-venv/bin:${PATH}" \
    PYTHON_EXECUTABLE=/opt/md-venv/bin/python

EXPOSE 3000
CMD ["npm", "run", "dev"]
