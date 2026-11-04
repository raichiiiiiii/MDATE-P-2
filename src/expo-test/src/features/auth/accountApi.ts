import type { ApiRequest } from "./apiClient";

export type ApiHeadersFactory = (url: string, method: "GET" | "POST" | "PUT") => Promise<Record<string, string>>;

export type AccountSetupInput = {
  displayName: string;
  preferredLanguage: string;
  accessibilityPreferences: {
    textSize: "small" | "medium" | "large";
    contrast: "normal" | "high";
    alternativeInputOn: boolean;
  };
  voicePreferences: {
    preferredVoiceId: string | null;
    audioRate: number;
    audioVolume: number;
    voiceDisabled: boolean;
  };
};

export type MdateAccount = {
  id: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  preferredLanguage: string;
  status: string;
  setupCompletedAt: string | null;
  setupComplete: boolean;
  roles: string[];
  accessibilityPreferences?: AccountSetupInput["accessibilityPreferences"];
  voicePreferences?: AccountSetupInput["voicePreferences"];
};

type AccountEnvelope = { account: MdateAccount; nextStep?: string };

export function normalizeAccount(account: Omit<MdateAccount, "setupComplete"> & { setupComplete?: boolean }): MdateAccount {
  const status = account.status.toUpperCase();
  if (status === "SUSPENDED" || status === "DELETED") {
    throw new Error("This account cannot access MDATE. Please contact support.");
  }
  return {
    ...account,
    setupComplete: typeof account.setupComplete === "boolean"
      ? account.setupComplete
      : account.setupCompletedAt != null,
    roles: Array.isArray(account.roles) ? account.roles : [],
  };
}

export async function getCurrentAccount(apiRequest: ApiRequest): Promise<MdateAccount> {
  const result = await apiRequest<AccountEnvelope>("/api/v1/me");
  if (!result?.account || typeof result.account.id !== "string") {
    throw new Error("The API returned an invalid current-account response.");
  }
  return normalizeAccount(result.account);
}

export async function completeAccountSetup(
  apiRequest: ApiRequest,
  input: AccountSetupInput,
): Promise<MdateAccount> {
  const result = await apiRequest<AccountEnvelope>("/api/v1/account/setup", {
    method: "PUT",
    body: {
      displayName: input.displayName.trim(),
      preferredLanguage: input.preferredLanguage,
      accessibilityPreferences: input.accessibilityPreferences,
      voicePreferences: input.voicePreferences,
    },
  });
  if (!result?.account) throw new Error("The API did not return the updated account.");
  return normalizeAccount(result.account);
}
