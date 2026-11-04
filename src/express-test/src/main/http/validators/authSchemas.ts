import { z } from "zod";

const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const password = z.string().min(12).max(128).refine(
  (value) => Buffer.byteLength(value, "utf8") <= 72,
  "Password must not exceed 72 UTF-8 bytes when using bcrypt.",
);

export const registerSchema = z.object({ email, password });
export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128).refine(
    (value) => Buffer.byteLength(value, "utf8") <= 72,
    "Password exceeds the bcrypt input limit.",
  ),
});
export const refreshSchema = z.object({ refreshToken: z.string().min(32).max(256).nullable().optional() });
export const passwordResetRequestSchema = z.object({ email });
export const passwordResetConfirmSchema = z.object({
  token: z.string().min(32).max(256),
  password,
});
