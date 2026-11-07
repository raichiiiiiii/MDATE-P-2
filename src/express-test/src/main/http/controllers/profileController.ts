import type { RequestHandler } from "express";
import { profileService } from "../../container.js";
import { AvatarStorageUnavailableError, AvatarUploadExpiredError, InvalidAvatarError, ProfileNotFoundError } from "../../../application/profile/ProfileService.js";
import { avatarUploadConfirmSchema, avatarUploadRequestSchema, updateProfileSchema } from "../validators/profileSchemas.js";

function userId(res: Parameters<RequestHandler>[1]): string { return res.locals.userId as string; }

function sendProfileError(error: unknown, res: Parameters<RequestHandler>[1]): boolean {
  if (error instanceof AvatarStorageUnavailableError) {
    res.status(503).json({ error: "avatar_storage_unavailable", message: error.message }); return true;
  }
  if (error instanceof InvalidAvatarError) {
    res.status(400).json({ error: "invalid_avatar", message: error.message }); return true;
  }
  if (error instanceof AvatarUploadExpiredError) {
    res.status(410).json({ error: "avatar_upload_expired", message: error.message }); return true;
  }
  if (error instanceof ProfileNotFoundError) {
    res.status(404).json({ error: "profile_not_found", message: error.message }); return true;
  }
  return false;
}

export const getProfileController: RequestHandler = async (_req, res, next) => {
  try { res.json(await profileService.getProfile(userId(res))); }
  catch (error) { if (!sendProfileError(error, res)) next(error); }
};

export const updateProfileController: RequestHandler = async (req, res, next) => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "invalid_request", message: "Enter a display name of 1 to 100 characters." }); return; }
  try { res.json(await profileService.updateDisplayName(userId(res), parsed.data.displayName)); }
  catch (error) { if (!sendProfileError(error, res)) next(error); }
};

export const createAvatarUploadController: RequestHandler = async (req, res, next) => {
  const parsed = avatarUploadRequestSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "invalid_request", message: "Choose a JPEG, PNG or WebP image no larger than 2 MB." }); return; }
  try { res.status(201).json(await profileService.createAvatarUpload(userId(res), parsed.data.contentType, parsed.data.sizeBytes)); }
  catch (error) { if (!sendProfileError(error, res)) next(error); }
};

export const confirmAvatarUploadController: RequestHandler = async (req, res, next) => {
  const parsed = avatarUploadConfirmSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "invalid_request", message: "The avatar upload reference is invalid." }); return; }
  try { res.json(await profileService.confirmAvatarUpload(userId(res), parsed.data.uploadId)); }
  catch (error) { if (!sendProfileError(error, res)) next(error); }
};

export const deleteAvatarController: RequestHandler = async (_req, res, next) => {
  try { res.json(await profileService.removeAvatar(userId(res))); }
  catch (error) { if (!sendProfileError(error, res)) next(error); }
};
