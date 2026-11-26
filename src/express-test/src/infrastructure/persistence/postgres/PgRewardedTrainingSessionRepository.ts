import type { Pool, QueryResultRow } from "pg";
import type {
  QuestionAttemptSubmission,
  RewardedSessionCompletion,
  RewardedTrainingSessionRepository,
  RewardedTrainingSessionSnapshot,
  SessionQuestionReward,
} from "../../../domain/training/RewardedTrainingSessionRepository.js";
import type { PublishedRewardTree, TrainingRewardRepository } from "../../../domain/training/TrainingRewardRepository.js";

type SessionDbRow = QueryResultRow & {
  id: string;
  submoduleId: string;
  gameMode: RewardedTrainingSessionSnapshot["gameMode"];
  expectedQuestions: number;
  completedQuestions: number;
  status: RewardedTrainingSessionSnapshot["status"];
  startedAt: Date;
  completedAt: Date | null;
};

type QuestionDbRow = QueryResultRow & {
  id: string;
  qSetId: string;
  difficulty: number;
  position: number;
  rewardCoins: number;
};

const SESSION_SELECT = `
  SELECT
    s.id,
    s.submodule_id AS "submoduleId",
    s.game_mode AS "gameMode",
    s.expected_matches AS "expectedQuestions",
    CASE
      WHEN s.game_mode = 'find_the_pair'
        THEN (SELECT COUNT(*)::int FROM training_session_matches m WHERE m.session_id = s.id)
      ELSE (SELECT COUNT(*)::int FROM training_session_question_results r WHERE r.session_id = s.id)
    END AS "completedQuestions",
    s.status,
    s.started_at AS "startedAt",
    s.completed_at AS "completedAt"
  FROM training_sessions s
`;

function toSession(row: SessionDbRow, questions: SessionQuestionReward[]): RewardedTrainingSessionSnapshot {
  return {
    id: row.id,
    submoduleId: row.submoduleId,
    gameMode: row.gameMode,
    expectedQuestions: row.expectedQuestions,
    completedQuestions: row.completedQuestions,
    status: row.status,
    startedAt: new Date(row.startedAt).toISOString(),
    completedAt: row.completedAt ? new Date(row.completedAt).toISOString() : null,
    questions,
  };
}

function selectQuestionsFromTree(tree: PublishedRewardTree, submoduleId: string): SessionQuestionReward[] {
  const submodule = tree.submodules.find((item) => item.id === submoduleId);
  if (!submodule) return [];
  return submodule.qSets.flatMap((qSet) => qSet.questions.map((question) => ({
    id: question.id,
    qSetId: qSet.id,
    difficulty: qSet.difficulty,
    position: question.position,
    rewardCoins: question.rewardCoins,
  })));
}

export class PgRewardedTrainingSessionRepository implements RewardedTrainingSessionRepository {
  constructor(
    private readonly pool: Pool,
    private readonly rewards: TrainingRewardRepository,
  ) {}

  async startSession(userId: string, submoduleId: string): Promise<RewardedTrainingSessionSnapshot | null> {
    const tree = await this.rewards.getSubmoduleRewardTree(submoduleId);
    if (!tree) return null;

    const submodule = tree.submodules.find((item) => item.id === submoduleId);
    if (!submodule) return null;
    const questions = selectQuestionsFromTree(tree, submoduleId);
    const activeQSets = submodule.qSets.filter((qSet) => qSet.questionCount > 0);

    if (questions.length === 0) return null;
    if (submodule.gameMode === "find_the_pair" &&
      (submodule.qSets.length !== 2 || activeQSets.length !== 2 || activeQSets.some((qSet) => qSet.questionCount !== 5) || questions.length !== 10)) {
      return null;
    }

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const created = await client.query<{
        id: string; submoduleId: string; gameMode: RewardedTrainingSessionSnapshot["gameMode"];
        expectedQuestions: number; completedQuestions: number; status: RewardedTrainingSessionSnapshot["status"];
        startedAt: Date; completedAt: Date | null;
      }>(
        `INSERT INTO training_sessions
           (user_id, submodule_id, game_mode, expected_matches, status)
         VALUES ($1, $2, $3, $4, 'IN_PROGRESS')
         RETURNING id, submodule_id AS "submoduleId", game_mode AS "gameMode",
                   expected_matches AS "expectedQuestions", 0::int AS "completedQuestions",
                   status, started_at AS "startedAt", completed_at AS "completedAt"`,
        [userId, submoduleId, submodule.gameMode, questions.length],
      );
      const session = created.rows[0];
      if (!session) throw new Error("The training session could not be created.");

      await client.query(
        `INSERT INTO training_session_questions (session_id, question_id, reward_coins)
         SELECT $1, item.question_id, item.reward_coins
         FROM unnest($2::uuid[], $3::int[]) AS item(question_id, reward_coins)`,
        [session.id, questions.map((item) => item.id), questions.map((item) => item.rewardCoins)],
      );
      await client.query("COMMIT");
      return toSession(session, questions);
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  async recordFindThePairMatch(
    userId: string,
    sessionId: string,
    questionId: string,
  ): Promise<RewardedSessionCompletion | null> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const selected = await client.query<SessionDbRow>(
        `${SESSION_SELECT} WHERE s.id = $1 AND s.user_id = $2 FOR UPDATE`,
        [sessionId, userId],
      );
      const session = selected.rows[0];
      if (!session || session.gameMode !== "find_the_pair") {
        await client.query("ROLLBACK");
        return null;
      }

      const question = await client.query(
        `SELECT 1 FROM training_session_questions WHERE session_id = $1 AND question_id = $2`,
        [sessionId, questionId],
      );
      if (!question.rowCount) {
        await client.query("ROLLBACK");
        return null;
      }

      if (session.status === "IN_PROGRESS") {
        await client.query(
          `INSERT INTO training_session_matches (session_id, question_id)
           VALUES ($1, $2)
           ON CONFLICT (session_id, question_id) DO NOTHING`,
          [sessionId, questionId],
        );
        const count = await client.query<{ count: number }>(
          `SELECT COUNT(*)::int AS count FROM training_session_matches WHERE session_id = $1`,
          [sessionId],
        );
        if ((count.rows[0]?.count ?? 0) >= session.expectedQuestions) {
          await client.query(
            `UPDATE training_sessions
             SET status = 'COMPLETED', completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP)
             WHERE id = $1 AND user_id = $2 AND status = 'IN_PROGRESS'`,
            [sessionId, userId],
          );
        }
      }

      const refreshed = await client.query<SessionDbRow>(
        `${SESSION_SELECT} WHERE s.id = $1 AND s.user_id = $2`,
        [sessionId, userId],
      );
      const questions = await this.loadSessionQuestions(client, sessionId);
      const row = refreshed.rows[0];
      if (!row) {
        await client.query("ROLLBACK");
        return null;
      }
      const rewardCoins = row.status === "COMPLETED"
        ? questions.reduce((sum, item) => sum + item.rewardCoins, 0)
        : 0;
      await client.query("COMMIT");
      return { session: toSession(row, questions), rewardCoins };
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  async completeAnsweredSession(
    userId: string,
    sessionId: string,
    results: QuestionAttemptSubmission[],
  ): Promise<RewardedSessionCompletion | null> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const selected = await client.query<SessionDbRow>(
        `${SESSION_SELECT} WHERE s.id = $1 AND s.user_id = $2 FOR UPDATE`,
        [sessionId, userId],
      );
      const session = selected.rows[0];
      if (!session || session.gameMode === "find_the_pair") {
        await client.query("ROLLBACK");
        return null;
      }

      const savedQuestions = await this.loadSessionQuestions(client, sessionId);
      if (session.status === "IN_PROGRESS") {
        if (results.length !== session.expectedQuestions) {
          await client.query("ROLLBACK");
          return null;
        }
        const expectedIds = new Set(savedQuestions.map((item) => item.id));
        const submittedIds = new Set(results.map((item) => item.questionId));
        if (submittedIds.size !== results.length || submittedIds.size !== expectedIds.size ||
            [...submittedIds].some((id) => !expectedIds.has(id))) {
          await client.query("ROLLBACK");
          return null;
        }

        for (const result of results) {
          await client.query(
            `INSERT INTO training_session_question_results
               (session_id, question_id, is_correct, attempts, duration_ms)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (session_id, question_id) DO NOTHING`,
            [sessionId, result.questionId, result.correct, result.attempts, result.durationMs],
          );
        }

        const resultCount = await client.query<{ count: number }>(
          `SELECT COUNT(*)::int AS count FROM training_session_question_results WHERE session_id = $1`,
          [sessionId],
        );
        if ((resultCount.rows[0]?.count ?? 0) !== session.expectedQuestions) {
          await client.query("ROLLBACK");
          return null;
        }
        await client.query(
          `UPDATE training_sessions
           SET status = 'COMPLETED', completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP)
           WHERE id = $1 AND user_id = $2 AND status = 'IN_PROGRESS'`,
          [sessionId, userId],
        );
      }

      const refreshed = await client.query<SessionDbRow>(
        `${SESSION_SELECT} WHERE s.id = $1 AND s.user_id = $2`,
        [sessionId, userId],
      );
      const row = refreshed.rows[0];
      if (!row) {
        await client.query("ROLLBACK");
        return null;
      }
      const rewardCoins = row.status === "COMPLETED"
        ? savedQuestions.reduce((sum, item) => sum + item.rewardCoins, 0)
        : 0;
      await client.query("COMMIT");
      return { session: toSession(row, savedQuestions), rewardCoins };
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  async markZeroRewardAsClaimed(userId: string, sessionId: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const session = await client.query(
        `SELECT id, status, reward_claimed_at
         FROM training_sessions
         WHERE id = $1 AND user_id = $2
         FOR UPDATE`,
        [sessionId, userId],
      );
      const row = session.rows[0] as { status: string; reward_claimed_at: Date | null } | undefined;
      if (!row || row.status !== "COMPLETED") {
        await client.query("ROLLBACK");
        return false;
      }
      if (row.reward_claimed_at) {
        await client.query("COMMIT");
        return false;
      }
      await client.query(
        `UPDATE training_sessions SET reward_claimed_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND user_id = $2 AND reward_claimed_at IS NULL`,
        [sessionId, userId],
      );
      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  private async loadSessionQuestions(client: import("pg").PoolClient, sessionId: string): Promise<SessionQuestionReward[]> {
    const result = await client.query<QuestionDbRow>(
      `SELECT
         tsq.question_id AS id,
         qs.id AS "qSetId",
         qs.difficulty_index AS difficulty,
         q.position,
         tsq.reward_coins AS "rewardCoins"
       FROM training_session_questions tsq
       JOIN questions q ON q.id = tsq.question_id
       JOIN q_sets qs ON qs.id = q.q_set_id
       WHERE tsq.session_id = $1
       ORDER BY qs.difficulty_index, qs.id, q.position, q.id`,
      [sessionId],
    );
    return result.rows.map((row) => ({
      id: row.id,
      qSetId: row.qSetId,
      difficulty: Number(row.difficulty),
      position: Number(row.position),
      rewardCoins: Number(row.rewardCoins),
    }));
  }
}
