import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  EXPO_WEB_ORIGIN: z.string().url().default("http://localhost:8081"),
  MEDIA_STORAGE_DIR: z.string().trim().min(1).default("./storage/media"),
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must contain at least 32 characters."),
  JWT_ISSUER: z.string().url().default("https://api.mdate.local"),
  JWT_AUDIENCE: z.string().min(1).default("mdate-app"),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().min(300).max(3600).default(900),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(30),
  PASSWORD_RESET_BASE_URL: z.string().url().default("http://localhost:8081/reset-password"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
  SMTP_SECURE: z.string().optional().transform((v) => v === "true"),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  MAIL_FROM: z.string().optional(),
});

export const env = envSchema.parse(process.env);
