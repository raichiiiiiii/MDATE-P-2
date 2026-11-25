import { Buffer } from "node:buffer";
import type {
  WalletCursor,
  WalletMutationResult,
  WalletRepository,
  WalletRewardReason,
  WalletSnapshot,
  WalletStoreItem,
  WalletTransactionPage,
} from "../../domain/wallet/Wallet.js";
import {
  InvalidWalletCursorError,
  RewardNotEligibleError,
} from "../../domain/wallet/Wallet.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class WalletService {
  constructor(private readonly wallets: WalletRepository) {}

  getWallet(userId: string): Promise<WalletSnapshot> {
    return this.wallets.getWallet(userId);
  }

  async listTransactions(userId: string, limitValue: number, cursorValue?: string): Promise<WalletTransactionPage> {
    const limit = Number.isInteger(limitValue) ? Math.min(100, Math.max(1, limitValue)) : 20;
    const cursor = cursorValue ? this.decodeCursor(cursorValue) : null;
    const rows = await this.wallets.listTransactions(userId, limit + 1, cursor);
    const hasMore = rows.length > limit;
    const transactions = hasMore ? rows.slice(0, limit) : rows;
    const last = transactions.at(-1);
    return {
      transactions,
      nextCursor: hasMore && last ? this.encodeCursor({ createdAt: last.createdAt, id: last.id }) : null,
    };
  }

  async claimReward(input: {
    userId: string;
    reason: WalletRewardReason;
    referenceId?: string;
    idempotencyKey: string;
  }): Promise<WalletMutationResult> {
    const referenceId = input.referenceId ?? null;
    if (input.reason === "SESSION_COMPLETE") {
      if (!referenceId || !UUID_PATTERN.test(referenceId)) {
        throw new RewardNotEligibleError("A valid server-issued training session is required for this reward.");
      }
    } else if (referenceId !== null) {
      throw new RewardNotEligibleError("Daily check-in rewards do not accept a reference ID.");
    }

    return this.wallets.applyTransaction({
      userId: input.userId,
      amount: null,
      type: "CREDIT",
      reason: input.reason,
      referenceId,
      idempotencyKey: input.idempotencyKey,
      metadata: { rewardRule: input.reason },
      ...(input.reason === "SESSION_COMPLETE" && referenceId
        ? { requiredCompletedSessionId: referenceId }
        : {}),
    });
  }

  async spendCoins(input: {
    userId: string;
    itemId: string;
    idempotencyKey: string;
  }): Promise<WalletMutationResult> {
    return this.wallets.applyTransaction({
      userId: input.userId,
      amount: null,
      type: "DEBIT",
      reason: "STORE_REDEEM",
      referenceId: input.itemId,
      idempotencyKey: input.idempotencyKey,
      metadata: { catalogItemId: input.itemId },
      storeItemId: input.itemId,
    });
  }

  private encodeCursor(cursor: WalletCursor): string {
    return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
  }

  private decodeCursor(value: string): WalletCursor {
    try {
      if (value.length > 512) throw new Error("cursor too long");
      const decoded: unknown = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
      if (typeof decoded !== "object" || decoded === null) throw new Error("not an object");
      const record = decoded as Record<string, unknown>;
      if (typeof record.createdAt !== "string" || Number.isNaN(Date.parse(record.createdAt))) throw new Error("invalid date");
      if (typeof record.id !== "string" || !UUID_PATTERN.test(record.id)) throw new Error("invalid ID");
      // Preserve the original DB timestamp precision; normalizing through Date would
      // truncate PostgreSQL microseconds and could skip rows sharing one millisecond.
      return { createdAt: record.createdAt, id: record.id };
    } catch {
      throw new InvalidWalletCursorError();
    }
  }
}
