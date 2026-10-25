import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  AUTH0_DOMAIN: z.string().trim().min(1).transform((value) =>
    value.replace(/^https?:\/\//, "").replace(/\/+$/, "")
  ),
  AUTH0_AUDIENCE: z.string().trim().min(1),
  EXPO_WEB_ORIGIN: z.string().url().default("http://localhost:8081"),
  // Relative paths resolve from the Express project's working directory.
  MEDIA_STORAGE_DIR: z.string().trim().min(1).default("./storage/media"),
});

export const env = envSchema.parse(process.env);
