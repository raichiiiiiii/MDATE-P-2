export type RewardGameMode = "find_the_pair" | "challenge" | "story_telling" | "standard_qset";
export type RewardedSessionStatus = "IN_PROGRESS" | "COMPLETED";

export interface SessionQuestionReward {
  id: string;
  qSetId: string;
  difficulty: number;
  position: number;
  rewardCoins: number;
}

export interface RewardedTrainingSessionSnapshot {
  id: string;
  submoduleId: string;
  gameMode: RewardGameMode;
  expectedQuestions: number;
  completedQuestions: number;
  status: RewardedSessionStatus;
  startedAt: string;
  completedAt: string | null;
  questions: SessionQuestionReward[];
}

export interface QuestionAttemptSubmission {
  questionId: string;
  correct: boolean;
  attempts: number;
  durationMs: number;
}

export interface RewardedSessionCompletion {
  session: RewardedTrainingSessionSnapshot;
  rewardCoins: number;
}

export interface RewardedTrainingSessionRepository {
  startSession(userId: string, submoduleId: string): Promise<RewardedTrainingSessionSnapshot | null>;
  recordFindThePairMatch(userId: string, sessionId: string, questionId: string): Promise<RewardedSessionCompletion | null>;
  completeAnsweredSession(userId: string, sessionId: string, results: QuestionAttemptSubmission[]): Promise<RewardedSessionCompletion | null>;
  markZeroRewardAsClaimed(userId: string, sessionId: string): Promise<boolean>;
}
