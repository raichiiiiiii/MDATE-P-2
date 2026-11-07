import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { ApiError, parseApiResponse, toApiUrl, type ApiRequest, type ApiRequestOptions } from "./apiClient";
import { completeAccountSetup, normalizeAccount, type AccountSetupInput, type MdateAccount, type ApiHeadersFactory } from "./accountApi";
import { saveAccountPreferences, type AccountPreferences } from "../settings/settingsApi";

export type AuthMode = "sign-in" | "sign-up";
export type AuthPhase = "loading" | "signed-out" | "setup-required" | "ready" | "error";

type SessionPayload = {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken?: string;
  account: MdateAccount;
};

type AuthContextValue = {
  user: MdateAccount | null;
  account: MdateAccount | null;
  accessToken: string | null;
  phase: AuthPhase;
  errorMessage: string | null;
  loadingProgress: number;
  loadingMessage: string;
  apiRequest: ApiRequest;
  getAuthHeaders: ApiHeadersFactory;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<string>;
  retrySession: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  confirmPasswordReset: (token: string, password: string) => Promise<void>;
  completeSetup: (input: AccountSetupInput) => Promise<void>;
  updatePreferences: (preferences: AccountPreferences) => Promise<AccountPreferences>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const REFRESH_TOKEN_KEY = "mdate.refresh-token.v1";

function isBrowser(): boolean {
  return Platform.OS === "web";
}

function credentialsMode(): RequestCredentials {
  return isBrowser() ? "include" : "same-origin";
}

async function publicRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const method = options.method ?? "POST";
  const headers: Record<string, string> = { Accept: "application/json", ...options.headers };
  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    if (typeof FormData !== "undefined" && options.body instanceof FormData) {
      body = options.body;
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(options.body);
    }
  }
  const response = await fetch(toApiUrl(path), {
    method,
    headers,
    body,
    credentials: credentialsMode(),
  });
  return parseApiResponse<T>(response);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<MdateAccount | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [phase, setPhase] = useState<AuthPhase>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(5);
  const [loadingMessage, setLoadingMessage] = useState("Starting MDATE…");
  const accessTokenRef = useRef<string | null>(null);
  const accessTokenExpiresAtRef = useRef<number>(0);
  const refreshPromiseRef = useRef<Promise<string> | null>(null);
  const refreshTokenRef = useRef<string | null>(null);

  const setAccessToken = useCallback((value: string | null) => {
    accessTokenRef.current = value;
    setAccessTokenState(value);
  }, []);

  const persistRefreshToken = useCallback(async (value: string | null) => {
    refreshTokenRef.current = value;
    if (!isBrowser()) {
      if (value) await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, value);
      else await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    }
  }, []);

  const acceptSession = useCallback(async (payload: SessionPayload) => {
    if (!payload.accessToken || !payload.account) throw new Error("The authentication response is incomplete.");
    const normalized = normalizeAccount(payload.account);
    setAccessToken(payload.accessToken);
    accessTokenExpiresAtRef.current = Date.now() + Math.max(60, payload.accessTokenExpiresIn ?? 900) * 1000;
    setUser(normalized);
    setErrorMessage(null);
    if (!isBrowser()) await persistRefreshToken(payload.refreshToken ?? null);
    const setupComplete = normalized.setupComplete;
    setPhase(setupComplete ? "ready" : "setup-required");
    setLoadingProgress(100);
    setLoadingMessage("Ready");
  }, [persistRefreshToken, setAccessToken]);

  const refreshSession = useCallback(async (): Promise<string> => {
    if (refreshPromiseRef.current) return refreshPromiseRef.current;
    const operation = (async () => {
      const savedToken = isBrowser()
        ? null
        : refreshTokenRef.current ?? await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      if (!isBrowser() && !savedToken) throw new ApiError("No saved session is available.", 401);
      const payload = await publicRequest<SessionPayload>("/api/v1/auth/refresh", {
        method: "POST",
        body: isBrowser() ? {} : { refreshToken: savedToken },
      });
      await acceptSession(payload);
      return payload.accessToken;
    })();
    refreshPromiseRef.current = operation;
    try {
      return await operation;
    } catch (error) {
      // A network outage must not destroy a valid refresh credential. Clear it
      // only when the server explicitly rejects the refresh session.
      if (error instanceof ApiError && (error.status === 400 || error.status === 401 || error.status === 403)) {
        setAccessToken(null);
        accessTokenExpiresAtRef.current = 0;
        setUser(null);
        if (!isBrowser()) await persistRefreshToken(null);
      }
      throw error;
    } finally {
      refreshPromiseRef.current = null;
    }
  }, [acceptSession, persistRefreshToken, setAccessToken]);

  const apiRequest = useCallback<ApiRequest>(async <T,>(path: string, options: ApiRequestOptions = {}): Promise<T> => {
    const send = async (token: string): Promise<Response> => {
      const method = options.method ?? "GET";
      const headers: Record<string, string> = {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      };
      let body: BodyInit | undefined;
      if (options.body !== undefined) {
        if (typeof FormData !== "undefined" && options.body instanceof FormData) {
          body = options.body;
        } else {
          headers["Content-Type"] = "application/json";
          body = JSON.stringify(options.body);
        }
      }
      return fetch(toApiUrl(path), { method, headers, body, credentials: credentialsMode() });
    };

    let token = accessTokenRef.current;
    if (!token) token = await refreshSession();
    let response = await send(token);
    if (response.status === 401) {
      token = await refreshSession();
      response = await send(token);
    }
    return parseApiResponse<T>(response);
  }, [refreshSession]);

  const getAuthHeaders = useCallback<ApiHeadersFactory>(async (_url, _method) => {
    let token = accessTokenRef.current;
    if (!token || accessTokenExpiresAtRef.current <= Date.now() + 30_000) {
      token = await refreshSession();
    }
    return { Authorization: `Bearer ${token}` };
  }, [refreshSession]);

  const signIn = useCallback(async (email: string, password: string) => {
    setErrorMessage(null);
    setLoadingMessage("Signing in securely…");
    setLoadingProgress(35);
    try {
      const payload = await publicRequest<SessionPayload>("/api/v1/auth/login", {
        method: "POST", body: { email: email.trim().toLowerCase(), password },
      });
      await acceptSession(payload);
    } catch (error) {
      setPhase("signed-out");
      throw error;
    }
  }, [acceptSession]);

  const signUp = useCallback(async (email: string, password: string) => {
    setErrorMessage(null);
    setLoadingMessage("Creating your MDATE account…");
    setLoadingProgress(35);
    try {
      const payload = await publicRequest<SessionPayload>("/api/v1/auth/register", {
        method: "POST", body: { email: email.trim().toLowerCase(), password },
      });
      await acceptSession(payload);
    } catch (error) {
      setPhase("signed-out");
      throw error;
    }
  }, [acceptSession]);

  const signOut = useCallback(async () => {
    const savedToken = isBrowser()
      ? null
      : refreshTokenRef.current ?? await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    await publicRequest<void>("/api/v1/auth/logout", {
      method: "POST", body: isBrowser() ? {} : { refreshToken: savedToken },
    });
    setAccessToken(null);
    accessTokenExpiresAtRef.current = 0;
    setUser(null);
    await persistRefreshToken(null);
    setPhase("signed-out");
    setErrorMessage(null);
    setLoadingProgress(0);
    setLoadingMessage("Ready to begin");
  }, [persistRefreshToken, setAccessToken]);

  const retrySession = useCallback(async () => {
    setPhase("loading");
    setErrorMessage(null);
    setLoadingProgress(20);
    setLoadingMessage("Checking your secure session…");
    try {
      await refreshSession();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setUser(null);
        setAccessToken(null);
        accessTokenExpiresAtRef.current = 0;
        setPhase("signed-out");
        setLoadingProgress(0);
        setLoadingMessage("Ready to begin");
        return;
      }
      setErrorMessage(error instanceof Error ? error.message : "We couldn't restore your session.");
      setPhase("error");
      setLoadingMessage("We couldn't finish loading your account.");
    }
  }, [refreshSession, setAccessToken]);

  useEffect(() => { void retrySession(); }, [retrySession]);

  const requestPasswordReset = useCallback(async (email: string) => {
    await publicRequest("/api/v1/auth/password-reset/request", {
      method: "POST", body: { email: email.trim().toLowerCase() },
    });
  }, []);

  const confirmPasswordReset = useCallback(async (token: string, password: string) => {
    await publicRequest("/api/v1/auth/password-reset/confirm", {
      method: "POST", body: { token, password },
    });
  }, []);

  const completeSetup = useCallback(async (input: AccountSetupInput) => {
    const account = await completeAccountSetup(apiRequest, input);
    setUser(account);
    setPhase("ready");
    setErrorMessage(null);
  }, [apiRequest]);

  const updatePreferences = useCallback(async (preferences: AccountPreferences) => {
    const saved = await saveAccountPreferences(apiRequest, preferences);
    setUser((current) => current ? {
      ...current,
      preferredLanguage: saved.preferredLanguage,
      accessibilityPreferences: saved.accessibilityPreferences,
      voicePreferences: saved.voicePreferences,
    } : current);
    return saved;
  }, [apiRequest]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    account: user,
    accessToken,
    phase,
    errorMessage,
    loadingProgress,
    loadingMessage,
    apiRequest,
    getAuthHeaders,
    signIn,
    signUp,
    signOut,
    refreshSession,
    retrySession,
    requestPasswordReset,
    confirmPasswordReset,
    completeSetup,
    updatePreferences,
  }), [
    user, accessToken, phase, errorMessage, loadingProgress, loadingMessage,
    apiRequest, getAuthHeaders, signIn, signUp, signOut, refreshSession, retrySession,
    requestPasswordReset, confirmPasswordReset, completeSetup, updatePreferences,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
