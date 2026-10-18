import { Router } from "express";

import { requireAuth } from "../../../infrastructure/auth/auth0JwtMiddleware.js";
import { requireHumanUser } from "../middleware/requireHumanUser.js";

import {
  bootstrapAccountController,
  completeAccountSetupController,
  currentAccountController,
} from "../controllers/accountController.js";

export const accountRoutes = Router();

accountRoutes.use(requireAuth, requireHumanUser);

accountRoutes.post("/account/bootstrap", bootstrapAccountController);
accountRoutes.get("/me", currentAccountController);
accountRoutes.put("/account/setup", completeAccountSetupController);
