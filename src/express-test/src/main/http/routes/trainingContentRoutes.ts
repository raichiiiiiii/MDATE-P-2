import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireActiveUser } from "../middleware/requireActiveUser.js";
import {
  getModuleController, getQSetController, listModulesController, listQSetsController,
} from "../controllers/trainingContentController.js";

export const trainingContentRoutes = Router();
trainingContentRoutes.use(requireAuth, requireActiveUser);
trainingContentRoutes.get("/modules", listModulesController);
trainingContentRoutes.get("/modules/:moduleId", getModuleController);
trainingContentRoutes.get("/submodules/:submoduleId/q-sets", listQSetsController);
trainingContentRoutes.get("/q-sets/:qSetId", getQSetController);
