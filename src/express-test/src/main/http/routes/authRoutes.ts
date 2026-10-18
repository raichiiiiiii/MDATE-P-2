import { Router } from "express";
import { requireAuth } from "../../../infrastructure/auth/auth0JwtMiddleware.js";
import { authCheckController } from "../controllers/authCheckController.js"

export const authRoutes = Router();

authRoutes.get("/auth-check", requireAuth, authCheckController);
