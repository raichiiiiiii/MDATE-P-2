import express from "express";
import cors from "cors";
import helmet from "helmet";

import { env } from "../shared/configuration/env.js";
import { healthRoutes } from "./http/routes/healthRoutes.js";
import { authRoutes } from "./http/routes/authRoutes.js";
import { notFoundHandler } from "./http/middleware/notFoundHandler.js";
import { errorHandler } from "./http/middleware/errorHandler.js";
import { accountRoutes } from "./http/routes/accountRoutes.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");

  app.use(helmet());

  app.use(
    cors({
      origin: env.EXPO_WEB_ORIGIN,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Authorization", "Content-Type"],
    })
  );

  app.use(express.json({ limit: "1mb" }));

  app.use("/health", healthRoutes);
  app.use("/api/v1", authRoutes);
  app.use("/api/v1", accountRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
