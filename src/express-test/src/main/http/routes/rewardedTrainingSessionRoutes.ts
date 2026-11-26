import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireActiveUser } from "../middleware/requireActiveUser.js";
import {
  completeRewardedTrainingSessionController,
  recordRewardedPairMatchController,
  startRewardedTrainingSessionController,
} from "../controllers/rewardedTrainingSessionController.js";

export const rewardedTrainingSessionRoutes = Router();
rewardedTrainingSessionRoutes.use(requireAuth, requireActiveUser);
rewardedTrainingSessionRoutes.post("/training/sessions", startRewardedTrainingSessionController);
rewardedTrainingSessionRoutes.post("/training/sessions/:sessionId/matches", recordRewardedPairMatchController);
rewardedTrainingSessionRoutes.post("/training/sessions/:sessionId/complete", completeRewardedTrainingSessionController);
