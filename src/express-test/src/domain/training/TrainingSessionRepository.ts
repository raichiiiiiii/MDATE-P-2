export type TrainingSessionStatus = "IN_PROGRESS" | "COMPLETED";

export interface TrainingSessionSnapshot {
  id: string;
  submoduleId: string;
  expectedMatches: number;
  matchedCount: number;
  status: TrainingSessionStatus;
  startedAt: string;
  completedAt: string | null;
}

export interface TrainingSessionRepository {
  startFindThePairSession(userId: string, submoduleId: string): Promise<TrainingSessionSnapshot | null>;
  recordFindThePairMatch(userId: string, sessionId: string, questionId: string): Promise<TrainingSessionSnapshot | null>;
}
