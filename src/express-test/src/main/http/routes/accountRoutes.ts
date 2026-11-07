import { Router } from "express";
import {
  currentAccountController,
  currentPreferencesController,
  completeAccountSetupController,
  updatePreferencesController,
} from "../controllers/accountController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireActiveUser } from "../middleware/requireActiveUser.js";

export const accountRoutes = Router();
accountRoutes.use(requireAuth);

// These two routes must remain accessible while an account is PENDING_SETUP.
accountRoutes.get("/me", currentAccountController);
accountRoutes.put("/account/setup", completeAccountSetupController);

// Settings are editable only after first-time setup has been completed.
accountRoutes.get("/me/preferences", requireActiveUser, currentPreferencesController);
accountRoutes.put("/me/preferences", requireActiveUser, updatePreferencesController);
