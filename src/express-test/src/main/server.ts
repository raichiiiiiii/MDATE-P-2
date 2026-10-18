import "dotenv/config";

import { createApp } from "./app.js";
import { env } from "../shared/configuration/env.js";

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.info(
    `[MDATE API] Listening on http://localhost:${env.PORT}`
  );
});

function shutdown(signal: string) {
  console.info(`[MDATE API] Received ${signal}; shutting down.`);
  server.close((error) => {
    if (error) {
      console.error("[MDATE API] Shutdown failed:", error);
      process.exitCode = 1;
    }
  });
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
