import type { TrainingSessionRepository, TrainingSessionSnapshot } from "../../domain/training/TrainingSessionRepository.js";

export class TrainingSessionNotFoundError extends Error {
  constructor() {
    super("The training session is invalid or does not belong to this account.");
    this.name = "TrainingSessionNotFoundError";
  }
}

export class TrainingSessionService {
  constructor(private readonly sessions: TrainingSessionRepository) {}

  async startFindThePairSession(userId: string, submoduleId: string): Promise<TrainingSessionSnapshot> {
    const session = await this.sessions.startFindThePairSession(userId, submoduleId);
    if (!session) throw new TrainingSessionNotFoundError();
    return session;
  }

  async recordFindThePairMatch(userId: string, sessionId: string, questionId: string): Promise<TrainingSessionSnapshot> {
    const session = await this.sessions.recordFindThePairMatch(userId, sessionId, questionId);
    if (!session) throw new TrainingSessionNotFoundError();
    return session;
  }
}
