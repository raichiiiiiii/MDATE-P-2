import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { extname } from "node:path";
import { Router } from "express";
import multer from "multer";

import { requireAuth } from "../../../infrastructure/auth/auth0JwtMiddleware.js";
import { requireHumanUser } from "../middleware/requireHumanUser.js";
import {
  evaluateSpeechAnswer,
  speechHealth,
  transcribeSpeech,
} from "../controllers/speechController.js";

class UnsupportedAudioTypeError extends Error {
  constructor() {
    super("Unsupported audio file type. Use WAV, MP3, M4A, OGG, WebM, or MP4 audio.");
    this.name = "UnsupportedAudioTypeError";
  }
}

const allowedExtensions = new Set([".wav", ".mp3", ".m4a", ".ogg", ".webm", ".mp4"]);
const allowedMimeTypes = new Set([
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/x-m4a",
  "audio/m4a",
  "audio/ogg",
  "audio/webm",
  "video/webm",
  "video/mp4",
  "application/octet-stream",
]);

const upload = multer({
  storage: multer.diskStorage({
    destination: tmpdir(),
    filename: (_req, file, callback) => {
      const extension = extname(file.originalname).toLowerCase();
      callback(null, `mdate-speech-${randomUUID()}${extension}`);
    },
  }),
  limits: {
    fileSize: 15 * 1024 * 1024,
    files: 1,
    fields: 4,
    fieldSize: 8 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    const extension = file.originalname.toLowerCase().match(/\.[^.]+$/)?.[0] ?? "";
    const mimeType = file.mimetype.toLowerCase();
    if (allowedExtensions.has(extension) && allowedMimeTypes.has(mimeType)) {
      callback(null, true);
      return;
    }
    callback(new UnsupportedAudioTypeError());
  },
});

export const speechRoutes = Router();

// Health reports worker state without forcing a costly model load.
speechRoutes.get("/speech/health", speechHealth);

// Patient audio is sensitive. Require a valid Auth0 token and a human MDATE user.
speechRoutes.post(
  "/speech/transcribe",
  requireAuth,
  requireHumanUser,
  upload.single("audio"),
  transcribeSpeech
);
speechRoutes.post(
  "/speech/evaluate",
  requireAuth,
  requireHumanUser,
  evaluateSpeechAnswer
);
