export type ApiHttpMethod = "GET" | "POST" | "PUT";

export type ApiHeadersFactory = (
  url: string,
  method: ApiHttpMethod
) => Promise<Record<string, string>>;

export type AccountSetupInput = {
  displayName: string;
  preferredLanguage: string;
  accessibilityPreferences: {
    textSize: "small" | "medium" | "large" | "extra-large";
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
  id?: string;
  status: string;
  setupComplete: boolean;
  roles: string[];
};

type JsonRecord = Record<string, unknown>;

function getApiBaseUrl(): string {
  const baseUrl =
    typeof window !== "undefined"
      ? process.env.EXPO_PUBLIC_API_URL_WEB
      : process.env.EXPO_PUBLIC_API_URL_NATIVE;

  if (!baseUrl) {
    throw new Error(
      "Missing API URL. Set EXPO_PUBLIC_API_URL_WEB and " +
        "EXPO_PUBLIC_API_URL_NATIVE in your .env file."
    );
  }

  return baseUrl.replace(/\/+$/, "");
}

function asRecord(value: unknown): JsonRecord | null {
  if (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  ) {
    return value as JsonRecord;
  }

  return null;
}

async function apiRequest(
  path: string,
  method: ApiHttpMethod,
  getAuthHeaders: ApiHeadersFactory,
  body?: unknown
): Promise<unknown> {
  const url = `${getApiBaseUrl()}${path}`;
  const authHeaders = await getAuthHeaders(url, method);

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...authHeaders,
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const record = asRecord(payload);

    console.error("[MDATE API error]", {
      path,
      status: response.status,
      response: payload,
    });

    const message =
      typeof record?.message === "string"
        ? record.message
        : typeof record?.error === "string"
          ? record.error
          : `The API returned HTTP ${response.status}.`;

    throw new Error(message);
  }

  return payload;
}

export async function bootstrapAccount(
  getAuthHeaders: ApiHeadersFactory
): Promise<void> {
  await apiRequest("/api/v1/account/bootstrap", "POST", getAuthHeaders, {});
}

export async function getCurrentAccount(
  getAuthHeaders: ApiHeadersFactory
): Promise<MdateAccount> {
  const payload = await apiRequest("/api/v1/me", "GET", getAuthHeaders);
  const root = asRecord(payload);

  if (!root) {
    throw new Error("The API returned an invalid account response.");
  }

  const data = asRecord(root.data);
  const account =
    asRecord(root.account) ??
    asRecord(root.user) ??
    asRecord(data?.account) ??
    asRecord(data?.user) ??
    data ??
    root;

  if (typeof account.status !== "string") {
    throw new Error(
      "The current-account response has no account status. " +
        "Align getCurrentAccount() with the Express /api/v1/me response."
    );
  }

  const status = account.status.toUpperCase();

  if (status === "SUSPENDED" || status === "DELETED") {
    throw new Error(
      "This account cannot access MDATE. Please contact support."
    );
  }

  let setupComplete: boolean;
  if (typeof account.setupComplete === "boolean") {
    setupComplete = account.setupComplete;
  } else if (typeof account.setup_complete === "boolean") {
    setupComplete = account.setup_complete;
  } else if ("setupCompletedAt" in account) {
    setupComplete = account.setupCompletedAt != null;
  } else if ("setup_completed_at" in account) {
    setupComplete = account.setup_completed_at != null;
  } else {
    // This fallback assumes ACTIVE means account setup is complete.
    setupComplete = status === "ACTIVE";
  }

  const roleValue = account.roles;
  const singleRole = account.role;
  const roles = Array.isArray(roleValue)
    ? roleValue.filter((role): role is string => typeof role === "string")
    : typeof singleRole === "string"
      ? [singleRole]
      : [];

  return {
    id: typeof account.id === "string" ? account.id : undefined,
    status,
    setupComplete,
    roles,
  };
}

export async function completeAccountSetup(
  getAuthHeaders: ApiHeadersFactory,
  input: AccountSetupInput
): Promise<void> {
  await apiRequest("/api/v1/account/setup", "PUT", getAuthHeaders, {
    displayName: input.displayName.trim(),
    preferredLanguage: input.preferredLanguage,
    accessibilityPreferences: {
      textSize: input.accessibilityPreferences.textSize,
      contrast: input.accessibilityPreferences.contrast,
      alternativeInputOn: input.accessibilityPreferences.alternativeInputOn,
    },
    voicePreferences: {
      preferredVoiceId: input.voicePreferences.preferredVoiceId,
      audioRate: input.voicePreferences.audioRate,
      audioVolume: input.voicePreferences.audioVolume,
      voiceDisabled: input.voicePreferences.voiceDisabled,
    },
  });
}
