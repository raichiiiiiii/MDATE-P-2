import type { Pool, QueryResultRow } from "pg";
import type {
  WalletCursor,
  WalletMutationResult,
  WalletRepository,
  WalletRewardReason,
  WalletRewardRule,
  WalletSnapshot,
  WalletStoreItem,
  WalletTransaction,
  WalletTransactionCommand,
} from "../../../domain/wallet/Wallet.js";
import {
  Wallet,
  IdempotencyConflictError,
  InsufficientCoinsError,
  InvalidCatalogItemError,
  InvalidTransactionAmountError,
  ItemAlreadyOwnedError,
  RewardLimitReachedError,
  RewardNotEligibleError,
} from "../../../domain/wallet/Wallet.js";

type WalletRow = QueryResultRow & {
  userId: string; balance: number; lifetimeEarned: number; updatedAt: Date | null;
};
type TransactionRow = QueryResultRow & {
  id: string; userId: string; amount: number; balanceAfter: number; type: "CREDIT" | "DEBIT";
  reason: WalletTransaction["reason"]; referenceId: string | null; idempotencyKey: string;
  metadata: Record<string, unknown>; createdAt: string;
};

function walletFromRow(row: WalletRow): WalletSnapshot {
  return {
    userId: row.userId,
    balance: row.balance,
    lifetimeEarned: row.lifetimeEarned,
    updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : null,
  };
}

function transactionFromRow(row: TransactionRow): WalletTransaction {
  return {
    id: row.id,
    userId: row.userId,
    amount: row.amount,
    balanceAfter: row.balanceAfter,
    type: row.type,
    reason: row.reason,
    referenceId: row.referenceId,
    idempotencyKey: row.idempotencyKey,
    metadata: row.metadata ?? {},
    createdAt: row.createdAt,
  };
}

const WALLET_SELECT = `
  SELECT user_id AS "userId", balance, lifetime_earned AS "lifetimeEarned", updated_at AS "updatedAt"
  FROM user_wallets
`;
const TRANSACTION_SELECT = `
  SELECT id, user_id AS "userId", amount, balance_after AS "balanceAfter", type, reason,
         reference_id AS "referenceId", idempotency_key AS "idempotencyKey",
         metadata,
         to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "createdAt"
  FROM coin_transactions
`;

export class PgWalletRepository implements WalletRepository {
  constructor(private readonly pool: Pool) {}

  async getWallet(userId: string): Promise<WalletSnapshot> {
    const result = await this.pool.query<WalletRow>(`${WALLET_SELECT} WHERE user_id = $1`, [userId]);
    const row = result.rows[0];
    return row ? walletFromRow(row) : { userId, balance: 0, lifetimeEarned: 0, updatedAt: null };
  }

  async listTransactions(userId: string, limit: number, cursor: WalletCursor | null): Promise<WalletTransaction[]> {
    const values: unknown[] = [userId];
    let cursorClause = "";
    if (cursor) {
      values.push(cursor.createdAt, cursor.id);
      cursorClause = `AND (created_at, id) < ($2::timestamptz, $3::uuid)`;
    }
    values.push(limit);
    const result = await this.pool.query<TransactionRow>(
      `${TRANSACTION_SELECT}
       WHERE user_id = $1 ${cursorClause}
       ORDER BY created_at DESC, id DESC
       LIMIT $${values.length}`,
      values,
    );
    return result.rows.map(transactionFromRow);
  }

  async findRewardRule(reason: WalletRewardReason): Promise<WalletRewardRule | null> {
    const result = await this.pool.query<QueryResultRow & {
      reason: WalletRewardReason; amount: number; maxClaimsPerUtcDay: number; isActive: boolean;
    }>(
      `SELECT reason, amount, max_claims_per_utc_day AS "maxClaimsPerUtcDay", is_active AS "isActive"
       FROM coin_reward_rules WHERE reason = $1`,
      [reason],
    );
    return result.rows[0] ?? null;
  }

  async findStoreItem(itemId: string): Promise<WalletStoreItem | null> {
    const result = await this.pool.query<QueryResultRow & {
      itemId: string; name: Record<string, string>; category: string; cost: number; isActive: boolean;
    }>(
      `SELECT item_id AS "itemId", name, category, cost, is_active AS "isActive"
       FROM coin_store_items WHERE item_id = $1`,
      [itemId],
    );
    return result.rows[0] ?? null;
  }

  async applyTransaction(command: WalletTransactionCommand): Promise<WalletMutationResult> {
    if (command.storeItemId) {
      if (command.amount !== null || command.type !== "DEBIT" || command.reason !== "STORE_REDEEM" ||
          command.referenceId !== command.storeItemId) {
        throw new InvalidTransactionAmountError("Store redemption commands must be server-priced debits for the referenced item.");
      }
    } else if (command.reason === "SESSION_COMPLETE" || command.reason === "DAILY_CHECKIN") {
      if (command.amount !== null || command.type !== "CREDIT") {
        throw new InvalidTransactionAmountError("Reward amounts must be resolved from server configuration.");
      }
    } else if (!Number.isInteger(command.amount) || command.amount === null || command.amount === 0 ||
        (command.type === "CREDIT" && command.amount < 0) ||
        (command.type === "DEBIT" && command.amount > 0)) {
      throw new InvalidTransactionAmountError();
    }
    if (command.reason === "STORE_REDEEM" && !command.storeItemId) {
      throw new InvalidTransactionAmountError("A store debit must be linked to a catalog item.");
    }
    if (command.reason === "SESSION_COMPLETE" &&
        (!command.requiredCompletedSessionId || command.requiredCompletedSessionId !== command.referenceId)) {
      throw new RewardNotEligibleError("A completed server session is required for this reward.");
    }
    if (command.reason !== "SESSION_COMPLETE" && command.requiredCompletedSessionId) {
      throw new InvalidTransactionAmountError("Only session-completion rewards may reference a training session.");
    }

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO user_wallets (user_id, balance, lifetime_earned)
         VALUES ($1, 0, 0) ON CONFLICT (user_id) DO NOTHING`,
        [command.userId],
      );
      const walletResult = await client.query<WalletRow>(
        `${WALLET_SELECT} WHERE user_id = $1 FOR UPDATE`,
        [command.userId],
      );
      const lockedWallet = walletResult.rows[0];
      if (!lockedWallet) throw new Error("The wallet row could not be initialized.");

      const sameKeyResult = await client.query<TransactionRow>(
        `${TRANSACTION_SELECT} WHERE user_id = $1 AND idempotency_key = $2`,
        [command.userId, command.idempotencyKey],
      );
      const sameKey = sameKeyResult.rows[0];
      if (sameKey) {
        this.assertSameOperation(sameKey, command);
        const result = { transaction: transactionFromRow(sameKey), wallet: walletFromRow(lockedWallet), duplicate: true };
        await client.query("COMMIT");
        return result;
      }

      if (command.requiredCompletedSessionId) {
        const sessionResult = await client.query<QueryResultRow & { status: string; rewardClaimedAt: Date | null }>(
          `SELECT status, reward_claimed_at AS "rewardClaimedAt"
           FROM training_sessions WHERE id = $1 AND user_id = $2 FOR UPDATE`,
          [command.requiredCompletedSessionId, command.userId],
        );
        const session = sessionResult.rows[0];
        if (!session || session.status !== "COMPLETED") throw new RewardNotEligibleError();
        if (session.rewardClaimedAt) {
          const previous = await client.query<TransactionRow>(
            `${TRANSACTION_SELECT}
             WHERE user_id = $1 AND reason = 'SESSION_COMPLETE' AND reference_id = $2`,
            [command.userId, command.requiredCompletedSessionId],
          );
          if (!previous.rows[0]) throw new Error("The session reward marker has no matching ledger entry.");
          const result = { transaction: transactionFromRow(previous.rows[0]), wallet: walletFromRow(lockedWallet), duplicate: true };
          await client.query("COMMIT");
          return result;
        }
      }

      let amount = command.amount;
      let maxClaimsPerUtcDay: number | undefined;

      if (command.reason === "SESSION_COMPLETE" || command.reason === "DAILY_CHECKIN") {
        const ruleResult = await client.query<QueryResultRow & {
          amount: number; maxClaimsPerUtcDay: number; isActive: boolean;
        }>(
          `SELECT amount, max_claims_per_utc_day AS "maxClaimsPerUtcDay", is_active AS "isActive"
           FROM coin_reward_rules WHERE reason = $1 FOR SHARE`,
          [command.reason],
        );
        const rule = ruleResult.rows[0];
        if (!rule?.isActive) throw new RewardNotEligibleError("This reward is not currently available.");
        amount = rule.amount;
        maxClaimsPerUtcDay = rule.maxClaimsPerUtcDay;
      }

      if (command.storeItemId) {
        const priorPurchase = await client.query<TransactionRow>(
          `${TRANSACTION_SELECT}
           WHERE user_id = $1 AND reason = 'STORE_REDEEM' AND reference_id = $2`,
          [command.userId, command.storeItemId],
        );
        if (priorPurchase.rows[0]) {
          const result = { transaction: transactionFromRow(priorPurchase.rows[0]), wallet: walletFromRow(lockedWallet), duplicate: true };
          await client.query("COMMIT");
          return result;
        }
        const ownership = await client.query(
          `SELECT 1 FROM user_coin_unlocks WHERE user_id = $1 AND item_id = $2`,
          [command.userId, command.storeItemId],
        );
        if (ownership.rowCount) throw new ItemAlreadyOwnedError();

        const itemResult = await client.query<QueryResultRow & { cost: number; isActive: boolean }>(
          `SELECT cost, is_active AS "isActive"
           FROM coin_store_items WHERE item_id = $1 FOR SHARE`,
          [command.storeItemId],
        );
        const item = itemResult.rows[0];
        if (!item?.isActive) throw new InvalidCatalogItemError();
        amount = -item.cost;
      }

      if (amount === null || !Number.isInteger(amount) || amount === 0 ||
          (command.type === "CREDIT" && amount < 0) ||
          (command.type === "DEBIT" && amount > 0)) {
        throw new InvalidTransactionAmountError();
      }

      if (maxClaimsPerUtcDay !== undefined) {
        const countResult = await client.query<QueryResultRow & { count: number }>(
          `SELECT COUNT(*)::int AS count
           FROM coin_transactions
           WHERE user_id = $1 AND reason = $2
             AND (created_at AT TIME ZONE 'UTC')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date`,
          [command.userId, command.reason],
        );
        if ((countResult.rows[0]?.count ?? 0) >= maxClaimsPerUtcDay) {
          throw new RewardLimitReachedError();
        }
      }

      const nextWallet = new Wallet(
        lockedWallet.userId,
        lockedWallet.balance,
        lockedWallet.lifetimeEarned,
      ).applyDelta(amount);
      const newBalance = nextWallet.balance;

      const inserted = await client.query<TransactionRow>(
        `INSERT INTO coin_transactions
           (user_id, amount, balance_after, type, reason, reference_id, idempotency_key, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
         RETURNING id, user_id AS "userId", amount, balance_after AS "balanceAfter", type, reason,
                   reference_id AS "referenceId", idempotency_key AS "idempotencyKey",
                   metadata,
                   to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "createdAt"`,
        [command.userId, amount, newBalance, command.type, command.reason,
          command.referenceId, command.idempotencyKey, JSON.stringify(command.metadata)],
      );
      const transactionRow = inserted.rows[0];
      if (!transactionRow) throw new Error("The coin ledger insert returned no transaction.");

      const updatedWallet = await client.query<WalletRow>(
        `UPDATE user_wallets
         SET balance = $2,
             lifetime_earned = lifetime_earned + CASE WHEN $3 > 0 THEN $3 ELSE 0 END,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $1 AND balance + $3 >= 0
         RETURNING user_id AS "userId", balance, lifetime_earned AS "lifetimeEarned", updated_at AS "updatedAt"`,
        [command.userId, newBalance, amount],
      );
      const newWalletRow = updatedWallet.rows[0];
      if (!newWalletRow) throw new InsufficientCoinsError(Math.abs(amount), lockedWallet.balance);

      if (command.requiredCompletedSessionId) {
        const marked = await client.query(
          `UPDATE training_sessions SET reward_claimed_at = CURRENT_TIMESTAMP
           WHERE id = $1 AND user_id = $2 AND status = 'COMPLETED' AND reward_claimed_at IS NULL`,
          [command.requiredCompletedSessionId, command.userId],
        );
        if (!marked.rowCount) throw new RewardNotEligibleError("This training session has already been rewarded.");
      }

      if (command.storeItemId) {
        await client.query(
          `INSERT INTO user_coin_unlocks (user_id, item_id, transaction_id)
           VALUES ($1, $2, $3)`,
          [command.userId, command.storeItemId, transactionRow.id],
        );
      }

      await client.query("COMMIT");
      return {
        transaction: transactionFromRow(transactionRow),
        wallet: walletFromRow(newWalletRow),
        duplicate: false,
      };
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  private assertSameOperation(row: TransactionRow, command: WalletTransactionCommand): void {
    if (row.type !== command.type || row.reason !== command.reason || row.referenceId !== command.referenceId) {
      throw new IdempotencyConflictError();
    }
  }
}
