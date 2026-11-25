import type { RequestHandler } from "express";
import { wallet } from "../../container.js";
import {
  IdempotencyConflictError,
  InsufficientCoinsError,
  InvalidCatalogItemError,
  InvalidTransactionAmountError,
  InvalidWalletCursorError,
  ItemAlreadyOwnedError,
  RewardLimitReachedError,
  RewardNotEligibleError,
} from "../../../domain/wallet/Wallet.js";
import { walletClaimSchema, walletSpendSchema } from "../validators/walletSchemas.js";

function userId(res: Parameters<RequestHandler>[1]): string {
  return res.locals.userId as string;
}

function sendWalletError(error: unknown, res: Parameters<RequestHandler>[1], next: Parameters<RequestHandler>[2]): void {
  if (error instanceof InsufficientCoinsError) {
    res.status(409).json({ error: "INSUFFICIENT_COINS", required: error.required, available: error.available, message: error.message });
    return;
  }
  if (error instanceof InvalidCatalogItemError) {
    res.status(400).json({ error: "INVALID_ITEM", message: error.message });
    return;
  }
  if (error instanceof ItemAlreadyOwnedError) {
    res.status(409).json({ error: "ITEM_ALREADY_OWNED", message: error.message });
    return;
  }
  if (error instanceof IdempotencyConflictError) {
    res.status(409).json({ error: "IDEMPOTENCY_KEY_REUSED", message: error.message });
    return;
  }
  if (error instanceof RewardNotEligibleError) {
    res.status(409).json({ error: "REWARD_NOT_ELIGIBLE", message: error.message });
    return;
  }
  if (error instanceof RewardLimitReachedError) {
    res.status(409).json({ error: "REWARD_LIMIT_REACHED", message: error.message });
    return;
  }
  if (error instanceof InvalidWalletCursorError || error instanceof InvalidTransactionAmountError) {
    res.status(400).json({ error: "INVALID_REQUEST", message: error.message });
    return;
  }
  next(error);
}

export const getMyWalletController: RequestHandler = async (_req, res, next) => {
  try {
    const current = await wallet.getWallet(userId(res));
    res.json({ wallet: current });
  } catch (error) { next(error); }
};

export const getWalletTransactionsController: RequestHandler = async (req, res, next) => {
  const limitValue = typeof req.query.limit === "string" ? Number(req.query.limit) : 20;
  const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;
  if (!Number.isInteger(limitValue) || limitValue < 1 || limitValue > 100 || (req.query.cursor !== undefined && cursor === undefined)) {
    res.status(400).json({ error: "INVALID_REQUEST", message: "Use a limit between 1 and 100 and a valid cursor." });
    return;
  }
  try {
    res.json(await wallet.listTransactions(userId(res), limitValue, cursor));
  } catch (error) { sendWalletError(error, res, next); }
};

export const claimWalletRewardController: RequestHandler = async (req, res, next) => {
  const parsed = walletClaimSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_REQUEST", message: "The reward claim request is invalid.", details: parsed.error.issues });
    return;
  }
  try {
    const result = await wallet.claimReward({ userId: userId(res), ...parsed.data });
    res.status(200).json({
      transaction: {
        id: result.transaction.id,
        amount: result.transaction.amount,
        balanceAfter: result.transaction.balanceAfter,
        reason: result.transaction.reason,
        createdAt: result.transaction.createdAt,
      },
      wallet: { balance: result.wallet.balance, lifetimeEarned: result.wallet.lifetimeEarned },
      duplicate: result.duplicate,
    });
  } catch (error) { sendWalletError(error, res, next); }
};

export const spendWalletCoinsController: RequestHandler = async (req, res, next) => {
  const parsed = walletSpendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_REQUEST", message: "The store redemption request is invalid.", details: parsed.error.issues });
    return;
  }
  try {
    const result = await wallet.spendCoins({ userId: userId(res), ...parsed.data });
    res.status(200).json({
      transaction: {
        id: result.transaction.id,
        amount: result.transaction.amount,
        balanceAfter: result.transaction.balanceAfter,
        reason: result.transaction.reason,
        createdAt: result.transaction.createdAt,
      },
      wallet: { balance: result.wallet.balance, lifetimeEarned: result.wallet.lifetimeEarned },
      duplicate: result.duplicate,
    });
  } catch (error) { sendWalletError(error, res, next); }
};
