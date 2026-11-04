import { Router } from "express";
import { currentAccountController, completeAccountSetupController } from "../controllers/accountController.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const accountRoutes = Router();
accountRoutes.use(requireAuth);
accountRoutes.get("/me", currentAccountController);
accountRoutes.put("/account/setup", completeAccountSetupController);
