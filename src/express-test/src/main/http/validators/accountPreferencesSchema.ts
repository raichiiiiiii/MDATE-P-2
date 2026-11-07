import { z } from "zod";

const accessibilityPreferencesSchema = z.object({
  textSize: z.enum(["small", "medium", "large"]),
  contrast: z.enum(["normal", "high"]),
  alternativeInputOn: z.boolean(),
});

const voicePreferencesSchema = z.object({
  preferredVoiceId: z.string().trim().max(100).nullable().transform((value) => value || null),
  audioRate: z.number().min(0.5).max(2),
  audioVolume: z.number().min(0).max(1),
  voiceDisabled: z.boolean(),
});

export const accountPreferencesSchema = z.object({
  preferredLanguage: z
    .string()
    .trim()
    .min(2)
    .max(35)
    .regex(/^[a-z]{2}(?:-[A-Z]{2})?$/, "Use a language tag such as en-MY or ms-MY."),
  accessibilityPreferences: accessibilityPreferencesSchema,
  voicePreferences: voicePreferencesSchema,
});
