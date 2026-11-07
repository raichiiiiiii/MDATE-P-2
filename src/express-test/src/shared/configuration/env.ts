import { z } from "zod";

const optionalSecret = z.string().optional().transform((value) => value?.trim() || undefined);

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
  EMAIL_CHANGE_BASE_URL: z.string().url().default("http://localhost:8081/confirm-email-change"),
  MINIO_ENDPOINT: z.string().url().default("http://localhost:9000"),
  MINIO_APP_USER: optionalSecret,
  MINIO_APP_PASSWORD: optionalSecret,
  MINIO_REGION: z.string().min(1).default("us-east-1"),
  MINIO_BUCKET_ASSETS: z.string().min(1).default("mdate-assets"),
  MINIO_PRESIGNED_URL_TTL_SECONDS: z.coerce.number().int().min(30).max(900).default(300),
  SMTP_HOST: optionalSecret,
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
  SMTP_SECURE: z.string().optional().transform((value) => value === "true"),
  SMTP_USER: optionalSecret,
  SMTP_PASSWORD: optionalSecret,
  MAIL_FROM: optionalSecret,
});

export const env = envSchema.parse(process.env);
