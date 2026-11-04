import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { extname } from "node:path";
import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireActiveUser } from "../middleware/requireActiveUser.js";
import { evaluateSpeechAnswer, speechHealth, transcribeSpeech } from "../controllers/speechController.js";

class UnsupportedAudioTypeError extends Error {
  constructor() {
    super("Unsupported audio file type. Use WAV, MP3, M4A, OGG, WebM, or MP4 audio.");
    this.name = "UnsupportedAudioTypeError";
  }
}
const allowedExtensions = new Set([".wav", ".mp3", ".m4a", ".ogg", ".webm", ".mp4"]);
const allowedMimeTypes = new Set([
  "audio/wav", "audio/x-wav", "audio/wave", "audio/mpeg", "audio/mp3",
  "audio/mp4", "audio/x-m4a", "audio/m4a", "audio/ogg", "audio/webm",
  "video/webm", "video/mp4", "application/octet-stream",
]);
const upload = multer({
  storage: multer.diskStorage({
    destination: tmpdir(),
    filename: (_req, file, callback) => callback(null, `mdate-speech-${randomUUID()}${extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 15 * 1024 * 1024, files: 1, fields: 4, fieldSize: 8 * 1024 },
  fileFilter: (_req, file, callback) => {
    const extension = file.originalname.toLowerCase().match(/\.[^.]+$/)?.[0] ?? "";
    if (allowedExtensions.has(extension) && allowedMimeTypes.has(file.mimetype.toLowerCase())) callback(null, true);
    else callback(new UnsupportedAudioTypeError());
  },
});

export const speechRoutes = Router();
speechRoutes.get("/speech/health", speechHealth);
speechRoutes.post("/speech/transcribe", requireAuth, requireActiveUser, upload.single("audio"), transcribeSpeech);
speechRoutes.post("/speech/evaluate", requireAuth, requireActiveUser, evaluateSpeechAnswer);
