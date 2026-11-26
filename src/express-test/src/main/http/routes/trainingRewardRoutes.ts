import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireActiveUser } from "../middleware/requireActiveUser.js";
import {
  getModuleRewardTreeController,
  getSubmoduleRewardTreeController,
} from "../controllers/trainingRewardController.js";

export const trainingRewardRoutes = Router();
trainingRewardRoutes.use(requireAuth, requireActiveUser);
trainingRewardRoutes.get("/training/modules/:moduleId/reward-tree", getModuleRewardTreeController);
trainingRewardRoutes.get("/training/submodules/:submoduleId/reward-tree", getSubmoduleRewardTreeController);
