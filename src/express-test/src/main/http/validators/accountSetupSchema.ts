import { z } from "zod";

const accessibilityPreferencesSchema = z.object({
  textSize: z.enum(["small", "medium", "large"]).default("medium"),
  contrast: z.enum(["normal", "high"]).default("normal"),
  alternativeInputOn: z.boolean().default(false),
});

const voicePreferencesSchema = z.object({
  preferredVoiceId: z.string().trim().max(100).nullable().default(null),
  audioRate: z.number().min(0.5).max(2).default(1),
  audioVolume: z.number().min(0).max(1).default(1),
  voiceDisabled: z.boolean().default(false),
});

export const accountSetupSchema = z.object({
  displayName: z.string().trim().min(1).max(100),

  preferredLanguage: z
    .string()
    .trim()
    .min(2)
    .max(35)
    .default("en-MY"),

  accessibilityPreferences: accessibilityPreferencesSchema.default({
    textSize: "medium",
    contrast: "normal",
    alternativeInputOn: false,
  }),

  voicePreferences: voicePreferencesSchema.default({
    preferredVoiceId: null,
    audioRate: 1,
    audioVolume: 1,
    voiceDisabled: false,
  }),
});
