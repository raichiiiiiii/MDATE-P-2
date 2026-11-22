FROM node:24-bookworm-slim

ENV EXPO_NO_TELEMETRY=1

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

EXPOSE 8081
CMD ["npx", "expo", "start", "--web", "--host", "lan", "--port", "8081"]
