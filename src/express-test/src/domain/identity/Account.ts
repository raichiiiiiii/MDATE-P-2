export type AccountStatus =
  | "PENDING_SETUP"
  | "ACTIVE"
  | "SUSPENDED"
  | "DELETED";

export type TextSize = "small" | "medium" | "large";
export type Contrast = "normal" | "high";

export interface AccountSnapshot {
  id: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  preferredLanguage: string;
  status: AccountStatus;
  setupCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  roles: string[];

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
}

export interface AccountSetupInput {
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
}

export interface BootstrapResult {
  account: AccountSnapshot;
  created: boolean;
}
