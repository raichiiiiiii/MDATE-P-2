/**
 * Validated user-editable account setup fields sent by the Expo client.
 * Authentication identity, account status, roles, IDs, and timestamps are not
 * part of this shape; those remain server-managed.
 */
export type TextSize = "small" | "medium" | "large" | "extra-large";
export type Contrast = "normal" | "high";

export type AccountSetupPreferencesInput = {
  displayName: string;
  preferredLanguage: string;
  accessibilityPreferences: {
    textSize: TextSize;
    contrast: Contrast;
    alternativeInputOn: boolean;
  };
  voicePreferences: {
    preferredVoiceId: string | null;
    audioRate: number;
    audioVolume: number;
    voiceDisabled: boolean;
  };
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") throw new Error(`${field} must be true or false.`);
  return value;
}

/** Validate API request-body data; never rely on TypeScript types for JSON. */
export function parseAccountSetupPreferences(value: unknown): AccountSetupPreferencesInput {
  if (!isRecord(value)) throw new Error("The account setup request body must be an object.");

  const displayName = typeof value.displayName === "string" ? value.displayName.trim() : "";
  if (displayName.length < 1 || displayName.length > 80) {
    throw new Error("displayName must contain between 1 and 80 characters.");
  }

  const preferredLanguage = typeof value.preferredLanguage === "string"
    ? value.preferredLanguage.trim()
    : "";
  if (!/^[a-z]{2}(?:-[A-Z]{2})?$/.test(preferredLanguage)) {
    throw new Error("preferredLanguage must use a language tag such as en-MY or ms-MY.");
  }

  const accessibility = value.accessibilityPreferences;
  if (!isRecord(accessibility)) {
    throw new Error("accessibilityPreferences must be provided as an object.");
  }
  const textSize = accessibility.textSize;
  if (!["small", "medium", "large", "extra-large"].includes(String(textSize))) {
    throw new Error("accessibilityPreferences.textSize is invalid.");
  }
  const contrast = accessibility.contrast;
  if (contrast !== "normal" && contrast !== "high") {
    throw new Error("accessibilityPreferences.contrast must be normal or high.");
  }

  const voice = value.voicePreferences;
  if (!isRecord(voice)) throw new Error("voicePreferences must be provided as an object.");
  const preferredVoiceId = voice.preferredVoiceId;
  if (preferredVoiceId !== null &&
      (typeof preferredVoiceId !== "string" || preferredVoiceId.trim().length > 120)) {
    throw new Error("voicePreferences.preferredVoiceId must be null or a string up to 120 characters.");
  }

  const audioRate = voice.audioRate;
  if (typeof audioRate !== "number" || !Number.isFinite(audioRate) || audioRate < 0.5 || audioRate > 2) {
    throw new Error("voicePreferences.audioRate must be between 0.5 and 2.0.");
  }
  const audioVolume = voice.audioVolume;
  if (typeof audioVolume !== "number" || !Number.isFinite(audioVolume) || audioVolume < 0 || audioVolume > 1) {
    throw new Error("voicePreferences.audioVolume must be between 0 and 1.");
  }

  return {
    displayName,
    preferredLanguage,
    accessibilityPreferences: {
      textSize: textSize as TextSize,
      contrast,
      alternativeInputOn: requireBoolean(
        accessibility.alternativeInputOn,
        "accessibilityPreferences.alternativeInputOn",
      ),
    },
    voicePreferences: {
      preferredVoiceId: typeof preferredVoiceId === "string" ? preferredVoiceId.trim() || null : null,
      audioRate,
      audioVolume,
      voiceDisabled: requireBoolean(voice.voiceDisabled, "voicePreferences.voiceDisabled"),
    },
  };
}
