import type { RequestHandler } from "express";
import { env } from "../../../shared/configuration/env.js";

/** Reject browser-origin requests from anything except the configured Expo Web origin. */
export const requireAllowedOrigin: RequestHandler = (req, res, next) => {
  const origin = req.headers.origin;
  if (typeof origin === "string" && origin !== env.EXPO_WEB_ORIGIN) {
    res.status(403).json({ error: "origin_not_allowed", message: "This browser origin is not allowed." });
    return;
  }
  next();
};
