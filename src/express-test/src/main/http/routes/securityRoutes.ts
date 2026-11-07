import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import {
  changePasswordController, listSessionsController, requestEmailChangeController,
  revokeOtherSessionsController, revokeSessionController,
} from "../controllers/securityController.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const securityRoutes = Router();
securityRoutes.use(requireAuth);
const passwordChangeLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: "draft-8", legacyHeaders: false });
const emailChangeLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 4, standardHeaders: "draft-8", legacyHeaders: false });
securityRoutes.post("/me/password/change", passwordChangeLimiter, changePasswordController);
securityRoutes.post("/me/email-change/request", emailChangeLimiter, requestEmailChangeController);
securityRoutes.get("/me/sessions", listSessionsController);
securityRoutes.delete("/me/sessions/:sessionId", revokeSessionController);
securityRoutes.post("/me/sessions/revoke-others", revokeOtherSessionsController);
