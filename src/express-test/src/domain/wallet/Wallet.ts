export type WalletTransactionType = "CREDIT" | "DEBIT";
export type WalletRewardReason = "SESSION_COMPLETE" | "DAILY_CHECKIN";
export type WalletTransactionReason = WalletRewardReason | "STORE_REDEEM" | "ADMIN_ADJUSTMENT";

export interface WalletSnapshot {
  userId: string;
  balance: number;
  lifetimeEarned: number;
  updatedAt: string | null;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  amount: number;
  balanceAfter: number;
  type: WalletTransactionType;
  reason: WalletTransactionReason;
  referenceId: string | null;
  idempotencyKey: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface WalletCursor {
  createdAt: string;
  id: string;
}

export interface WalletTransactionPage {
  transactions: WalletTransaction[];
  nextCursor: string | null;
}

export interface WalletRewardRule {
  reason: WalletRewardReason;
  amount: number;
  maxClaimsPerUtcDay: number;
  isActive: boolean;
}

export interface WalletStoreItem {
  itemId: string;
  name: Record<string, string>;
  category: string;
  cost: number;
  isActive: boolean;
}

export interface WalletMutationResult {
  transaction: WalletTransaction;
  wallet: WalletSnapshot;
  duplicate: boolean;
}

export interface WalletTransactionCommand {
  userId: string;
  amount: number | null;
  type: WalletTransactionType;
  reason: WalletTransactionReason;
  referenceId: string | null;
  idempotencyKey: string;
  metadata: Record<string, unknown>;
  requiredCompletedSessionId?: string;
  storeItemId?: string;
}

export interface WalletRepository {
  getWallet(userId: string): Promise<WalletSnapshot>;
  listTransactions(userId: string, limit: number, cursor: WalletCursor | null): Promise<WalletTransaction[]>;
  findRewardRule(reason: WalletRewardReason): Promise<WalletRewardRule | null>;
  findStoreItem(itemId: string): Promise<WalletStoreItem | null>;
  applyTransaction(command: WalletTransactionCommand): Promise<WalletMutationResult>;
}

export class InsufficientCoinsError extends Error {
  constructor(readonly required: number, readonly available: number) {
    super("The wallet does not have enough coins for this purchase.");
    this.name = "InsufficientCoinsError";
  }
}

export class InvalidTransactionAmountError extends Error {
  constructor(message = "A wallet transaction must have a non-zero amount with a matching type.") {
    super(message);
    this.name = "InvalidTransactionAmountError";
  }
}

export class InvalidCatalogItemError extends Error {
  constructor() {
    super("The selected store item is unknown or inactive.");
    this.name = "InvalidCatalogItemError";
  }
}

export class ItemAlreadyOwnedError extends Error {
  constructor() {
    super("This reward has already been unlocked.");
    this.name = "ItemAlreadyOwnedError";
  }
}

export class IdempotencyConflictError extends Error {
  constructor() {
    super("This idempotency key was already used for a different wallet operation.");
    this.name = "IdempotencyConflictError";
  }
}

export class RewardNotEligibleError extends Error {
  constructor(message = "The activity has not been completed on the server.") {
    super(message);
    this.name = "RewardNotEligibleError";
  }
}

export class RewardLimitReachedError extends Error {
  constructor() {
    super("The reward claim limit for today has been reached.");
    this.name = "RewardLimitReachedError";
  }
}

export class InvalidWalletCursorError extends Error {
  constructor() {
    super("The transaction cursor is invalid. Refresh the transaction history and try again.");
    this.name = "InvalidWalletCursorError";
  }
}

/** Immutable domain model for the current wallet state. */
export class Wallet {
  constructor(
    readonly userId: string,
    readonly balance: number,
    readonly lifetimeEarned: number,
  ) {
    if (!Number.isInteger(balance) || balance < 0 || !Number.isInteger(lifetimeEarned) || lifetimeEarned < 0) {
      throw new Error("Wallet state must contain non-negative integer balances.");
    }
  }

  applyDelta(amount: number): Wallet {
    if (!Number.isInteger(amount) || amount === 0) throw new InvalidTransactionAmountError();
    const nextBalance = this.balance + amount;
    if (nextBalance < 0) throw new InsufficientCoinsError(Math.abs(amount), this.balance);
    const nextLifetimeEarned = this.lifetimeEarned + (amount > 0 ? amount : 0);
    return new Wallet(this.userId, nextBalance, nextLifetimeEarned);
  }

  toSnapshot(updatedAt: string | null = null): WalletSnapshot {
    return {
      userId: this.userId,
      balance: this.balance,
      lifetimeEarned: this.lifetimeEarned,
      updatedAt,
    };
  }
}
