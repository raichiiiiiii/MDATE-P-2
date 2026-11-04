import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import {
  loginController, logoutController, passwordResetConfirmController,
  passwordResetRequestController, refreshController, registerController,
} from "../controllers/authController.js";
import { authCheckController } from "../controllers/authCheckController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireAllowedOrigin } from "../middleware/requireAllowedOrigin.js";

export const authRoutes = Router();
authRoutes.use(requireAllowedOrigin);
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false });
const registerLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: "draft-8", legacyHeaders: false });
const resetLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 4, standardHeaders: "draft-8", legacyHeaders: false });

authRoutes.post("/auth/register", registerLimiter, registerController);
authRoutes.post("/auth/login", loginLimiter, loginController);
authRoutes.post("/auth/refresh", refreshController);
authRoutes.post("/auth/logout", logoutController);
authRoutes.post("/auth/password-reset/request", resetLimiter, passwordResetRequestController);
authRoutes.post("/auth/password-reset/confirm", resetLimiter, passwordResetConfirmController);
authRoutes.get("/auth-check", requireAuth, authCheckController);
