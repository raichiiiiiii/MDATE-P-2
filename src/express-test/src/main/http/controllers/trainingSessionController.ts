import type { RequestHandler } from "express";
import { trainingSessions } from "../../container.js";
import { TrainingSessionNotFoundError } from "../../../application/training/TrainingSessionService.js";
import { startTrainingSessionSchema, recordTrainingMatchSchema } from "../validators/trainingSessionSchemas.js";

function userId(res: Parameters<RequestHandler>[1]): string {
  return res.locals.userId as string;
}

function singleParam(value: string | string[] | undefined): string | null {
  return typeof value === "string" ? value : null;
}

export const startFindThePairSessionController: RequestHandler = async (req, res, next) => {
  const parsed = startTrainingSessionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_REQUEST", message: "A valid Find the Pair submodule ID is required." });
    return;
  }
  try {
    const session = await trainingSessions.startFindThePairSession(userId(res), parsed.data.submoduleId);
    res.status(201).json({ session });
  } catch (error) {
    if (error instanceof TrainingSessionNotFoundError) {
      res.status(404).json({ error: "TRAINING_SESSION_NOT_AVAILABLE", message: error.message });
      return;
    }
    next(error);
  }
};

export const recordFindThePairMatchController: RequestHandler = async (req, res, next) => {
  const sessionId = singleParam(req.params.sessionId);
  const parsed = recordTrainingMatchSchema.safeParse(req.body);
  if (!sessionId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId) || !parsed.success) {
    res.status(400).json({ error: "INVALID_REQUEST", message: "A valid session ID and question ID are required." });
    return;
  }
  try {
    const session = await trainingSessions.recordFindThePairMatch(userId(res), sessionId, parsed.data.questionId);
    res.json({ session });
  } catch (error) {
    if (error instanceof TrainingSessionNotFoundError) {
      res.status(404).json({ error: "TRAINING_SESSION_NOT_AVAILABLE", message: error.message });
      return;
    }
    next(error);
  }
};
