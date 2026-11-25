import type { ApiRequest } from "../../auth/apiClient";

export type WalletSummary = {
  userId: string;
  balance: number;
  lifetimeEarned: number;
  updatedAt: string | null;
};

export type WalletTransaction = {
  id: string;
  userId: string;
  amount: number;
  balanceAfter: number;
  type: "CREDIT" | "DEBIT";
  reason: "SESSION_COMPLETE" | "DAILY_CHECKIN" | "STORE_REDEEM" | "ADMIN_ADJUSTMENT";
  referenceId: string | null;
  idempotencyKey: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type WalletTransactionPage = {
  transactions: WalletTransaction[];
  nextCursor: string | null;
};

export type WalletMutationResult = {
  transaction: Pick<WalletTransaction, "id" | "amount" | "balanceAfter" | "reason" | "createdAt">;
  wallet: Pick<WalletSummary, "balance" | "lifetimeEarned">;
  duplicate: boolean;
};

export type TrainingSession = {
  id: string;
  submoduleId: string;
  expectedMatches: number;
  matchedCount: number;
  status: "IN_PROGRESS" | "COMPLETED";
  startedAt: string;
  completedAt: string | null;
};

export async function getMyWallet(apiRequest: ApiRequest): Promise<WalletSummary> {
  const response = await apiRequest<{ wallet: WalletSummary }>("/api/v1/me/wallet");
  return response.wallet;
}

export function getWalletTransactions(
  apiRequest: ApiRequest,
  options: { limit?: number; cursor?: string } = {},
): Promise<WalletTransactionPage> {
  const query = new URLSearchParams();
  if (options.limit !== undefined) query.set("limit", String(options.limit));
  if (options.cursor) query.set("cursor", options.cursor);
  const encodedQuery = query.toString();
  const suffix = encodedQuery ? `?${encodedQuery}` : "";
  return apiRequest<WalletTransactionPage>(`/api/v1/me/wallet/transactions${suffix}`);
}

export function claimWalletReward(
  apiRequest: ApiRequest,
  input: { reason: "SESSION_COMPLETE" | "DAILY_CHECKIN"; idempotencyKey: string; referenceId?: string },
): Promise<WalletMutationResult> {
  return apiRequest<WalletMutationResult>("/api/v1/me/wallet/rewards/claim", { method: "POST", body: input });
}

export function spendCoins(
  apiRequest: ApiRequest,
  input: { itemId: string; idempotencyKey: string },
): Promise<WalletMutationResult> {
  return apiRequest<WalletMutationResult>("/api/v1/me/wallet/spend", { method: "POST", body: input });
}

export async function startFindThePairSession(
  apiRequest: ApiRequest,
  submoduleId: string,
): Promise<TrainingSession> {
  const response = await apiRequest<{ session: TrainingSession }>("/api/v1/me/training-sessions", {
    method: "POST",
    body: { submoduleId },
  });
  return response.session;
}

export async function recordFindThePairMatch(
  apiRequest: ApiRequest,
  sessionId: string,
  questionId: string,
): Promise<TrainingSession> {
  const response = await apiRequest<{ session: TrainingSession }>(
    `/api/v1/me/training-sessions/${encodeURIComponent(sessionId)}/matches`,
    { method: "POST", body: { questionId } },
  );
  return response.session;
}
