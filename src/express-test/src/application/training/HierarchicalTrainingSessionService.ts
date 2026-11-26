import type {
  QuestionAttemptSubmission,
  RewardedSessionCompletion,
  RewardedTrainingSessionRepository,
  RewardedTrainingSessionSnapshot,
} from "../../domain/training/RewardedTrainingSessionRepository.js";
import type { WalletService } from "../wallet/WalletService.js";
import type { WalletMutationResult, WalletSnapshot } from "../../domain/wallet/Wallet.js";

export class RewardedTrainingSessionNotFoundError extends Error {
  constructor() {
    super("The training session is invalid, incomplete, or does not belong to this account.");
    this.name = "RewardedTrainingSessionNotFoundError";
  }
}

export interface TrainingSessionSettlement {
  transaction: WalletMutationResult["transaction"] | null;
  wallet: WalletSnapshot;
  duplicate: boolean;
}

export interface SettledTrainingSession {
  session: RewardedTrainingSessionSnapshot;
  rewardCoins: number;
  settlement: TrainingSessionSettlement;
}

export class HierarchicalTrainingSessionService {
  constructor(
    private readonly sessions: RewardedTrainingSessionRepository,
    private readonly wallet: WalletService,
  ) {}

  start(userId: string, submoduleId: string): Promise<RewardedTrainingSessionSnapshot> {
    return this.sessions.startSession(userId, submoduleId).then((session) => {
      if (!session) throw new RewardedTrainingSessionNotFoundError();
      return session;
    });
  }

  async recordPairMatch(userId: string, sessionId: string, questionId: string): Promise<{
    session: RewardedTrainingSessionSnapshot;
    settlement?: TrainingSessionSettlement;
    rewardCoins: number;
  }> {
    const completed = await this.sessions.recordFindThePairMatch(userId, sessionId, questionId);
    if (!completed) throw new RewardedTrainingSessionNotFoundError();
    if (completed.session.status !== "COMPLETED") {
      return { session: completed.session, rewardCoins: 0 };
    }
    const settlement = await this.settle(userId, sessionId, completed.rewardCoins, completed.session.submoduleId);
    return { session: completed.session, settlement, rewardCoins: completed.rewardCoins };
  }

  async completeAnsweredSession(
    userId: string,
    sessionId: string,
    results: QuestionAttemptSubmission[],
  ): Promise<SettledTrainingSession> {
    const completed: RewardedSessionCompletion | null =
      await this.sessions.completeAnsweredSession(userId, sessionId, results);
    if (!completed || completed.session.status !== "COMPLETED") {
      throw new RewardedTrainingSessionNotFoundError();
    }
    const settlement = await this.settle(
      userId,
      sessionId,
      completed.rewardCoins,
      completed.session.submoduleId,
    );
    return { session: completed.session, rewardCoins: completed.rewardCoins, settlement };
  }

  private async settle(
    userId: string,
    sessionId: string,
    rewardCoins: number,
    submoduleId: string,
  ): Promise<TrainingSessionSettlement> {
    if (rewardCoins === 0) {
      const firstSettlement = await this.sessions.markZeroRewardAsClaimed(userId, sessionId);
      return {
        transaction: null,
        wallet: await this.wallet.getWallet(userId),
        duplicate: !firstSettlement,
      };
    }

    const result = await this.wallet.creditTrainingSessionReward({
      userId,
      sessionId,
      amount: rewardCoins,
      metadata: { submoduleId, rewardCoins, rewardModel: "hierarchical-hamilton-v1" },
    });
    return {
      transaction: result.transaction,
      wallet: result.wallet,
      duplicate: result.duplicate,
    };
  }
}
