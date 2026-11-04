export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type ApiRequestOptions = {
  method?: ApiMethod;
  body?: unknown;
  headers?: Record<string, string>;
};
export type ApiRequest = <T = unknown>(path: string, options?: ApiRequestOptions) => Promise<T>;

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

export function getApiBaseUrl(): string {
  const value = typeof window !== "undefined"
    ? process.env.EXPO_PUBLIC_API_URL_WEB
    : process.env.EXPO_PUBLIC_API_URL_NATIVE;
  if (!value) {
    throw new Error("Set EXPO_PUBLIC_API_URL_WEB and EXPO_PUBLIC_API_URL_NATIVE in your Expo environment.");
  }
  return value.replace(/\/+$/, "");
}

export function toApiUrl(path: string): string {
  return `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function parseApiResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const record = typeof payload === "object" && payload !== null
      ? payload as Record<string, unknown>
      : {};
    const message = typeof record.message === "string"
      ? record.message
      : typeof record.error === "string"
        ? record.error
        : `The API returned HTTP ${response.status}.`;
    throw new ApiError(message, response.status);
  }
  return payload as T;
}
