import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireActiveUser } from "../middleware/requireActiveUser.js";
import {
  recordFindThePairMatchController,
  startFindThePairSessionController,
} from "../controllers/trainingSessionController.js";

export const trainingSessionRoutes = Router();
trainingSessionRoutes.use("/me/training-sessions", requireAuth, requireActiveUser);
trainingSessionRoutes.post("/me/training-sessions", startFindThePairSessionController);
trainingSessionRoutes.post("/me/training-sessions/:sessionId/matches", recordFindThePairMatchController);
