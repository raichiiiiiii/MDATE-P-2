import type { RequestHandler } from "express";
import { unlink } from "node:fs/promises";
import { z } from "zod";
import { speechAssessmentService } from "../../../application/speech/SpeechAssessmentService.js";
import { whisperWorker } from "../../../infrastructure/speech/WhisperWorker.js";

const languageSchema = z.preprocess(
  (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
  z.enum(["ms", "en", "malay", "english"]).default("ms")
);

const evaluationSchema = z.object({
  answer: z.string().trim().min(1).max(500),
  target: z.string().trim().min(1).max(200),
  language: languageSchema,
});

type ApiLanguage = "ms" | "en" | "malay" | "english";

function normalizeLanguage(language: ApiLanguage): "ms" | "en" {
  return language === "malay" ? "ms" : language === "english" ? "en" : language;
}

export const speechHealth: RequestHandler = (_req, res) => {
  const worker = whisperWorker.status;
  res.status(200).json({
    feature: "speech-assessment",
    status: worker.state,
    ready: worker.ready,
    model: worker.model,
    ...(worker.error
      ? {
          error: "speech_worker_unavailable",
          ...(process.env.NODE_ENV !== "production" ? { detail: worker.error } : {}),
        }
      : {}),
    note:
      worker.state === "not_started"
        ? "The local model starts when the first transcription request is received."
        : undefined,
  });
};

export const transcribeSpeech: RequestHandler = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({
        error: "audio_required",
        message: 'Upload one audio file using the multipart field "audio".',
      });
      return;
    }

    const audioPath = req.file.path;
    try {
      const parsedLanguage = languageSchema.safeParse(req.body?.language ?? "ms");
      if (!parsedLanguage.success) {
        res.status(400).json({
          error: "invalid_language",
          message: "Language must be Malay (ms) or English (en).",
        });
        return;
      }

      const language = normalizeLanguage(parsedLanguage.data);
      const result = await speechAssessmentService.transcribe(audioPath, language);

      res.status(200).json({
        status: result.status,
        transcript: result.transcript,
        language,
        durationSeconds: result.durationSeconds,
        model: result.model,
      });
    } finally {
      // Recordings are temporary inputs, not persistent MDATE media assets.
      await unlink(audioPath).catch(() => undefined);
    }
  } catch (error) {
    next(error);
  }
};

export const evaluateSpeechAnswer: RequestHandler = (req, res, next) => {
  const parsed = evaluationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "invalid_request",
      message: "Provide answer and target strings, plus an optional language of ms or en.",
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path,
        message: issue.message,
      })),
    });
    return;
  }

  try {
    const language = normalizeLanguage(parsed.data.language);
    const result = speechAssessmentService.evaluate(
      parsed.data.answer,
      parsed.data.target,
      language
    );
    res.status(200).json({ ...result, language, scoring: "prototype_lexical_match_only" });
  } catch (error) {
    next(error);
  }
};
