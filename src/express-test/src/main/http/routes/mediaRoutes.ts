import { Router } from "express";
import { getMediaController } from "../controllers/trainingContentController.js";

// This route serves only generic media linked to active questions in a
// published training module. Patient recordings never use this endpoint.
// Keeping the image URL fetchable without a bearer header allows React Native
// Image and web <img> to load it; asset access is constrained in the repository.
export const mediaRoutes = Router();
mediaRoutes.get("/:assetId", getMediaController);
