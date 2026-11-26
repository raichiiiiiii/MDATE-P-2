import type { RequestHandler } from "express";
import { z } from "zod";
import { hierarchicalTrainingSessions } from "../../container.js";
import { RewardedTrainingSessionNotFoundError } from "../../../application/training/HierarchicalTrainingSessionService.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const startSchema = z.object({ submoduleId: z.string().uuid() });
const resultSchema = z.object({
  questionId: z.string().uuid(),
  correct: z.boolean(),
  attempts: z.number().int().min(1).max(100),
  durationMs: z.number().int().min(0).max(3_600_000),
});
const completeSchema = z.object({
  results: z.array(resultSchema).min(1).max(500),
}).strict();

function userId(res: Parameters<RequestHandler>[1]): string {
  return res.locals.userId as string;
}
function getSessionId(req: Parameters<RequestHandler>[0]): string | null {
  const value = req.params.sessionId;
  return typeof value === "string" && UUID_PATTERN.test(value) ? value : null;
}

function notFound(res: Parameters<RequestHandler>[1]) {
  res.status(404).json({
    error: "TRAINING_SESSION_NOT_AVAILABLE",
    message: "The training session is missing, incomplete, or does not belong to this account.",
  });
}

export const startRewardedTrainingSessionController: RequestHandler = async (req, res, next) => {
  const parsed = startSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_REQUEST", message: "A valid published submodule ID is required." });
    return;
  }
  try {
    const session = await hierarchicalTrainingSessions.start(userId(res), parsed.data.submoduleId);
    res.status(201).json({ session });
  } catch (error) {
    if (error instanceof RewardedTrainingSessionNotFoundError) { notFound(res); return; }
    next(error);
  }
};

export const recordRewardedPairMatchController: RequestHandler = async (req, res, next) => {
  const sessionId = getSessionId(req);
  const parsed = z.object({ questionId: z.string().uuid() }).safeParse(req.body);
  if (!sessionId || !parsed.success) {
    res.status(400).json({ error: "INVALID_REQUEST", message: "A valid session ID and question ID are required." });
    return;
  }
  try {
    const result = await hierarchicalTrainingSessions.recordPairMatch(userId(res), sessionId, parsed.data.questionId);
    res.json(result);
  } catch (error) {
    if (error instanceof RewardedTrainingSessionNotFoundError) { notFound(res); return; }
    next(error);
  }
};

export const completeRewardedTrainingSessionController: RequestHandler = async (req, res, next) => {
  const sessionId = getSessionId(req);
  const parsed = completeSchema.safeParse(req.body);
  if (!sessionId || !parsed.success) {
    res.status(400).json({ error: "INVALID_REQUEST", message: "Submit one result for every question in this session." });
    return;
  }
  try {
    const completed = await hierarchicalTrainingSessions.completeAnsweredSession(
      userId(res),
      sessionId,
      parsed.data.results,
    );
    res.json(completed);
  } catch (error) {
    if (error instanceof RewardedTrainingSessionNotFoundError) { notFound(res); return; }
    next(error);
  }
};
