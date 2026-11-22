import { Router } from "express";
import multer from "multer";
import {
  confirmAvatarUploadController, createAvatarUploadController, deleteAvatarController,
  getProfileController, getUserAvatarController, updateProfileController,
  uploadAvatarDirectController,
} from "../controllers/profileController.js";
import { requireAuth } from "../middleware/requireAuth.js";

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
});

export const profileRoutes = Router();
// Avatar image retrieval must be public so standard <img> and <Image> tags can load it
profileRoutes.get("/users/:userId/avatar", getUserAvatarController);

profileRoutes.use(requireAuth);
profileRoutes.get("/me/profile", getProfileController);
profileRoutes.patch("/me/profile", updateProfileController);
profileRoutes.post("/me/profile/avatar", avatarUpload.single("avatar"), uploadAvatarDirectController);
profileRoutes.post("/me/profile/avatar/upload-url", createAvatarUploadController);
profileRoutes.post("/me/profile/avatar/confirm", confirmAvatarUploadController);
profileRoutes.delete("/me/profile/avatar", deleteAvatarController);
