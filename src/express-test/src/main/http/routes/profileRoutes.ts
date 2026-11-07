import { Router } from "express";
import {
  confirmAvatarUploadController, createAvatarUploadController, deleteAvatarController,
  getProfileController, updateProfileController,
} from "../controllers/profileController.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const profileRoutes = Router();
profileRoutes.use(requireAuth);
profileRoutes.get("/me/profile", getProfileController);
profileRoutes.patch("/me/profile", updateProfileController);
profileRoutes.post("/me/profile/avatar/upload-url", createAvatarUploadController);
profileRoutes.post("/me/profile/avatar/confirm", confirmAvatarUploadController);
profileRoutes.delete("/me/profile/avatar", deleteAvatarController);
