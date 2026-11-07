import { z } from "zod";

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(100),
});

export const avatarUploadRequestSchema = z.object({
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  sizeBytes: z.number().int().min(1).max(2 * 1024 * 1024),
});

export const avatarUploadConfirmSchema = z.object({
  uploadId: z.string().uuid(),
});
