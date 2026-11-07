import { z } from "zod";

const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const password = z.string().min(12).max(128).refine(
  (value) => Buffer.byteLength(value, "utf8") <= 72,
  "Password must not exceed 72 UTF-8 bytes when using bcrypt.",
);

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: password,
});

export const requestEmailChangeSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newEmail: email,
});

export const confirmEmailChangeSchema = z.object({
  token: z.string().min(32).max(256),
});
