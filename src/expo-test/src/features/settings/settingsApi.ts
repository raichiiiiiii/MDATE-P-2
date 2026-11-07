import type { ApiRequest } from "../auth/apiClient";
import type { AccountSetupInput } from "../auth/accountApi";

/** The same preferences collected during setup, editable later from Settings. */
export type AccountPreferences = Omit<AccountSetupInput, "displayName">;

type PreferencesEnvelope = { preferences: AccountPreferences };

export async function getAccountPreferences(apiRequest: ApiRequest): Promise<AccountPreferences> {
  const result = await apiRequest<PreferencesEnvelope>("/api/v1/me/preferences");
  if (!result?.preferences) {
    throw new Error("The API returned an invalid preferences response.");
  }
  return result.preferences;
}

export async function saveAccountPreferences(
  apiRequest: ApiRequest,
  preferences: AccountPreferences,
): Promise<AccountPreferences> {
  const result = await apiRequest<PreferencesEnvelope>("/api/v1/me/preferences", {
    method: "PUT",
    body: {
      preferredLanguage: preferences.preferredLanguage,
      accessibilityPreferences: preferences.accessibilityPreferences,
      voicePreferences: preferences.voicePreferences,
    },
  });
  if (!result?.preferences) {
    throw new Error("The API did not return the saved preferences.");
  }
  return result.preferences;
}
