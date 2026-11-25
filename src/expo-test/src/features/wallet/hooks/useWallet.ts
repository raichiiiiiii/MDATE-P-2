import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import type { ApiRequest } from "../../auth/apiClient";
import { getMyWallet, type WalletSummary } from "../services/walletApi";

/** Wallet reads are deliberately non-blocking; callers may keep rendering offline. */
export function useWallet(apiRequest: ApiRequest) {
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshWallet = useCallback(async (): Promise<WalletSummary | null> => {
    setError(null);
    try {
      const current = await getMyWallet(apiRequest);
      setWallet(current);
      return current;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Wallet balance is unavailable.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);

  // Refresh on entry and whenever the user returns to the dashboard from a session/store screen.
  useFocusEffect(useCallback(() => {
    void refreshWallet();
  }, [refreshWallet]));

  return { wallet, loading, error, refreshWallet };
}
