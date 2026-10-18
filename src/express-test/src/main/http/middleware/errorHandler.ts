import type { ErrorRequestHandler } from "express";
import {
  InvalidTokenError,
  UnauthorizedError,
} from "express-oauth2-jwt-bearer";

export const errorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  next
) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof InvalidTokenError) {
    res.status(401).json({
      error: "invalid_token",
      message: "The access token is invalid or expired.",
    });
    return;
  }

  if (error instanceof UnauthorizedError) {
    res.set(error.headers);
    res.status(401).json({
      error: "unauthorized",
      message: "Authentication is required.",
    });
    return;
  }

  console.error("[MDATE API] Unexpected error:", error);

  res.status(500).json({
    error: "internal_server_error",
    message: "An unexpected error occurred.",
  });
};
