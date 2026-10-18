import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { useAuth0 } from "react-native-auth0";

import {
  bootstrapAccount,
  completeAccountSetup,
  getCurrentAccount,
  type AccountSetupInput,
  type ApiHeadersFactory,
  type MdateAccount,
} from "./accountApi";
import {
  AUTH0_AUDIENCE,
  AUTH0_CUSTOM_SCHEME,
} from "./auth0Config";

export type AuthMode = "sign-in" | "sign-up";

export type AuthPhase =
  | "loading"
  | "signed-out"
  | "setup-required"
  | "ready"
  | "error";

type AuthFlowContextValue = {
  phase: AuthPhase;
  account: MdateAccount | null;
  errorMessage: string | null;
  loadingProgress: number;
  loadingMessage: string;
  signIn: (mode: AuthMode, email?: string) => Promise<void>;
  retrySession: () => Promise<void>;
  completeSetup: (input: AccountSetupInput) => Promise<void>;
};

const AuthFlowContext =
  createContext<AuthFlowContextValue | null>(null);

const AUTH_SCOPE = "openid profile email offline_access";

export function AuthFlowProvider({
  children,
}: PropsWithChildren) {
  const {
    authorize,
    getApiCredentials,
    getDPoPHeaders,
    user: auth0User,
    isLoading: auth0IsLoading,
  } = useAuth0();

  const [phase, setPhase] = useState<AuthPhase>("loading");
  const [account, setAccount] = useState<MdateAccount | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(5);
  const [loadingMessage, setLoadingMessage] = useState(
    "Starting MDATE…"
  );

  /**
   * Loading progress represents completed initialization milestones,
   * not an estimate of elapsed time.
   */
  const getAuthHeaders: ApiHeadersFactory = useCallback(
    async (url, method) => {
      const credentials = await getApiCredentials(
        AUTH0_AUDIENCE,
        AUTH_SCOPE,
        0
      );

      // Log metadata only. Never log the access token itself.
      console.info("[MDATE API credentials]", {
        tokenType: credentials.tokenType,
        segmentCount: credentials.accessToken.split(".").length,
      });

      return getDPoPHeaders({
        url,
        method,
        accessToken: credentials.accessToken,
        tokenType: credentials.tokenType,
      });
    },
    [getApiCredentials, getDPoPHeaders]
  );

  const synchronizeAccount = useCallback(async () => {
    setLoadingProgress(35);
    setLoadingMessage("Connecting securely to MDATE…");

    await bootstrapAccount(getAuthHeaders);

    setLoadingProgress(68);
    setLoadingMessage("Checking your account details…");

    const currentAccount = await getCurrentAccount(getAuthHeaders);

    setLoadingProgress(92);
    setLoadingMessage("Preparing your MDATE home screen…");

    setAccount(currentAccount);
    setErrorMessage(null);
    setLoadingProgress(100);
    setLoadingMessage("Ready");
    setPhase(
      currentAccount.setupComplete ? "ready" : "setup-required"
    );
  }, [getAuthHeaders]);

  const retrySession = useCallback(async () => {
    if (auth0IsLoading) {
      setPhase("loading");
      setLoadingProgress(10);
      setLoadingMessage("Checking your secure sign-in…");
      return;
    }

    if (!auth0User) {
      setAccount(null);
      setErrorMessage(null);
      setLoadingProgress(0);
      setLoadingMessage("Ready to begin");
      setPhase("signed-out");
      return;
    }

    setPhase("loading");
    setErrorMessage(null);
    setLoadingProgress(20);
    setLoadingMessage("Secure sign-in restored. Preparing your account…");

    try {
      await synchronizeAccount();
    } catch (error) {
      console.error(
        "Session or account synchronization failed:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We couldn't load your MDATE account. Please try again."
      );
      setLoadingMessage("We couldn't finish loading your account.");
      setPhase("error");
    }
  }, [auth0IsLoading, auth0User, synchronizeAccount]);

  useEffect(() => {
    void retrySession();
  }, [retrySession]);

  const signIn = useCallback(
    async (mode: AuthMode, email?: string) => {
      setErrorMessage(null);

      await authorize(
        {
          audience: AUTH0_AUDIENCE,
          scope: AUTH_SCOPE,
          additionalParameters: {
            screen_hint: mode === "sign-up" ? "signup" : "login",
            ...(email?.trim() ? { login_hint: email.trim() } : {}),
            // Temporary diagnostic setting. Remove after the consent
            // configuration is confirmed in the Auth0 dashboard.
            prompt: "consent",
          },
        },
        {
          customScheme: AUTH0_CUSTOM_SCHEME,
        }
      );
    },
    [authorize]
  );

  const completeSetup = useCallback(
    async (input: AccountSetupInput) => {
      setErrorMessage(null);

      try {
        await completeAccountSetup(getAuthHeaders, input);
        const currentAccount = await getCurrentAccount(getAuthHeaders);

        if (!currentAccount.setupComplete) {
          throw new Error(
            "The server has not confirmed account setup completion."
          );
        }

        setAccount(currentAccount);
        setPhase("ready");
        setErrorMessage(null);
      } catch (error) {
        console.error("Account setup failed:", error);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "We couldn't save your account details. Please try again."
        );
        setPhase("setup-required");
        throw error;
      }
    },
    [getAuthHeaders]
  );

  return (
    <AuthFlowContext.Provider
      value={{
        phase,
        account,
        errorMessage,
        loadingProgress,
        loadingMessage,
        signIn,
        retrySession,
        completeSetup,
      }}
    >
      {children}
    </AuthFlowContext.Provider>
  );
}

export function useAuthFlow(): AuthFlowContextValue {
  const context = useContext(AuthFlowContext);

  if (!context) {
    throw new Error(
      "useAuthFlow must be used inside AuthFlowProvider."
    );
  }

  return context;
}
