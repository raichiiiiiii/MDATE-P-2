import { Router } from "express";

import { requireAuth } from "../../../infrastructure/auth/auth0JwtMiddleware.js";
import { requireHumanUser } from "../middleware/requireHumanUser.js";
import {
  getModuleController,
  getQSetController,
  listModulesController,
  listQSetsController,
} from "../controllers/trainingContentController.js";

export const trainingContentRoutes = Router();

// Published content metadata is available only to authenticated human users.
// Attach auth to concrete routes so requests for account endpoints are not
// authenticated twice when Express falls through between routers.
trainingContentRoutes.get("/modules", requireAuth, requireHumanUser, listModulesController);
trainingContentRoutes.get("/modules/:moduleId", requireAuth, requireHumanUser, getModuleController);
trainingContentRoutes.get("/submodules/:submoduleId/q-sets", requireAuth, requireHumanUser, listQSetsController);
trainingContentRoutes.get("/q-sets/:qSetId", requireAuth, requireHumanUser, getQSetController);
