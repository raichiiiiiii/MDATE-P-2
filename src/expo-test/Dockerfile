FROM node:24-bookworm-slim

ENV CI=1 \
    EXPO_NO_TELEMETRY=1

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

EXPOSE 8081
CMD ["npx", "expo", "start", "--web", "--host", "lan", "--port", "8081"]
