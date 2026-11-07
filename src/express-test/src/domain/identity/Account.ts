export type AccountStatus =
  | "PENDING_SETUP"
  | "ACTIVE"
  | "SUSPENDED"
  | "DELETED";

export type TextSize = "small" | "medium" | "large";
export type Contrast = "normal" | "high";

export interface AccessibilityPreferences {
  textSize: TextSize;
  contrast: Contrast;
  alternativeInputOn: boolean;
}

export interface VoicePreferences {
  preferredVoiceId: string | null;
  audioRate: number;
  audioVolume: number;
  voiceDisabled: boolean;
}

/** Preferences that an authenticated, active patient can change in Settings. */
export interface AccountPreferencesInput {
  preferredLanguage: string;
  accessibilityPreferences: AccessibilityPreferences;
  voicePreferences: VoicePreferences;
}

export interface AccountSnapshot extends AccountPreferencesInput {
  id: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  status: AccountStatus;
  setupCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  roles: string[];
}

/** Fields collected during first-time setup; settings are edited separately later. */
export interface AccountSetupInput extends AccountPreferencesInput {
  displayName: string;
}
