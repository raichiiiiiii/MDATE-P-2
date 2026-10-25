import "dotenv/config";

import { createApp } from "./app.js";
import { env } from "../shared/configuration/env.js";
import { whisperWorker } from "../infrastructure/speech/WhisperWorker.js";

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.info(`[MDATE API] Listening on http://localhost:${env.PORT}`);
});

let isShuttingDown = false;

function shutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.info(`[MDATE API] Received ${signal}; shutting down.`);

  void whisperWorker.stop().catch((error: unknown) => {
    console.error("[MDATE API] Whisper worker shutdown failed:", error);
    process.exitCode = 1;
  });

  server.close((error) => {
    if (error) {
      console.error("[MDATE API] Shutdown failed:", error);
      process.exitCode = 1;
    }
  });
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
