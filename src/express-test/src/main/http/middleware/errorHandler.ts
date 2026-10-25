import type { ErrorRequestHandler } from "express";
import multer from "multer";
import {
  InvalidTokenError,
  UnauthorizedError,
} from "express-oauth2-jwt-bearer";
import { SpeechWorkerError } from "../../../infrastructure/speech/WhisperWorker.js";

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

  if (error instanceof multer.MulterError) {
    const isTooLarge = error.code === "LIMIT_FILE_SIZE";
    res.status(isTooLarge ? 413 : 400).json({
      error: isTooLarge ? "audio_file_too_large" : "invalid_upload",
      message: isTooLarge
        ? "Audio uploads must be 15 MB or smaller."
        : "The audio upload is invalid. Include one file in the multipart field named audio.",
    });
    return;
  }

  if (error instanceof Error && error.name === "UnsupportedAudioTypeError") {
    res.status(415).json({
      error: "unsupported_audio_type",
      message: error.message,
    });
    return;
  }

  if (error instanceof SpeechWorkerError) {
    res.status(error.statusCode).json({
      error: error.code.toLowerCase(),
      message: error.message,
    });
    return;
  }

  console.error("[MDATE API] Unexpected error:", error);

  res.status(500).json({
    error: "internal_server_error",
    message: "An unexpected error occurred.",
  });
};
