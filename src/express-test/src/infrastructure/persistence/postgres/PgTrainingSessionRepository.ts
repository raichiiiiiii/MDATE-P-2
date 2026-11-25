import type { Pool, QueryResultRow } from "pg";
import type { TrainingSessionRepository, TrainingSessionSnapshot } from "../../../domain/training/TrainingSessionRepository.js";

type SessionRow = QueryResultRow & {
  id: string;
  submoduleId: string;
  expectedMatches: number;
  matchedCount: number;
  status: "IN_PROGRESS" | "COMPLETED";
  startedAt: Date;
  completedAt: Date | null;
};

function toSnapshot(row: SessionRow): TrainingSessionSnapshot {
  return {
    id: row.id,
    submoduleId: row.submoduleId,
    expectedMatches: row.expectedMatches,
    matchedCount: row.matchedCount,
    status: row.status,
    startedAt: new Date(row.startedAt).toISOString(),
    completedAt: row.completedAt ? new Date(row.completedAt).toISOString() : null,
  };
}

const SESSION_SELECT = `
  SELECT s.id, s.submodule_id AS "submoduleId", s.expected_matches AS "expectedMatches",
         (SELECT COUNT(*)::int FROM training_session_matches m WHERE m.session_id = s.id) AS "matchedCount",
         s.status, s.started_at AS "startedAt", s.completed_at AS "completedAt"
  FROM training_sessions s
`;

export class PgTrainingSessionRepository implements TrainingSessionRepository {
  constructor(private readonly pool: Pool) {}

  async startFindThePairSession(userId: string, submoduleId: string): Promise<TrainingSessionSnapshot | null> {
    const result = await this.pool.query<SessionRow>(
      `WITH eligible_submodule AS (
         SELECT sm.id
         FROM submodules sm
         JOIN module_versions mv ON mv.id = sm.module_version_id
         JOIN training_modules tm ON tm.id = mv.module_id
         WHERE sm.id = $2
           AND sm.exercise_type = 'find_the_pair'
           AND mv.status = 'published'
           AND tm.archived_at IS NULL
           AND (SELECT COUNT(*) FROM q_sets qs WHERE qs.submodule_id = sm.id) = 2
           AND NOT EXISTS (
             SELECT 1
             FROM q_sets qs
             LEFT JOIN questions q ON q.q_set_id = qs.id AND q.is_active = TRUE
             WHERE qs.submodule_id = sm.id
             GROUP BY qs.id
             HAVING COUNT(q.id) <> 5
           )
       ), eligible_questions AS (
         SELECT q.id
         FROM questions q
         JOIN q_sets qs ON qs.id = q.q_set_id
         JOIN eligible_submodule es ON es.id = qs.submodule_id
         WHERE q.is_active = TRUE
       ), new_session AS (
         INSERT INTO training_sessions (user_id, submodule_id, expected_matches, status)
         SELECT $1, es.id, 10, 'IN_PROGRESS'
         FROM eligible_submodule es
         WHERE (SELECT COUNT(*) FROM eligible_questions) = 10
         RETURNING id, submodule_id AS "submoduleId", expected_matches AS "expectedMatches",
                   status, started_at AS "startedAt", completed_at AS "completedAt"
       ), saved_questions AS (
         INSERT INTO training_session_questions (session_id, question_id)
         SELECT ns.id, eq.id FROM new_session ns CROSS JOIN eligible_questions eq
         RETURNING question_id
       )
       SELECT ns.id, ns."submoduleId", ns."expectedMatches", 0::int AS "matchedCount",
              ns.status, ns."startedAt", ns."completedAt"
       FROM new_session ns
       CROSS JOIN (SELECT COUNT(*) FROM saved_questions) saved`,
      [userId, submoduleId],
    );
    const row = result.rows[0];
    return row ? toSnapshot(row) : null;
  }

  async recordFindThePairMatch(userId: string, sessionId: string, questionId: string): Promise<TrainingSessionSnapshot | null> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const selected = await client.query<SessionRow>(
        `${SESSION_SELECT} WHERE s.id = $1 AND s.user_id = $2 FOR UPDATE`,
        [sessionId, userId],
      );
      const session = selected.rows[0];
      if (!session) {
        await client.query("ROLLBACK");
        return null;
      }

      const question = await client.query<{ questionId: string }>(
        `SELECT question_id AS "questionId"
         FROM training_session_questions
         WHERE session_id = $1 AND question_id = $2`,
        [sessionId, questionId],
      );
      if (!question.rows[0]) {
        await client.query("ROLLBACK");
        return null;
      }

      if (session.status === "IN_PROGRESS") {
        await client.query(
          `INSERT INTO training_session_matches (session_id, question_id)
           VALUES ($1, $2) ON CONFLICT (session_id, question_id) DO NOTHING`,
          [sessionId, questionId],
        );
        const countResult = await client.query<{ count: number }>(
          `SELECT COUNT(*)::int AS count FROM training_session_matches WHERE session_id = $1`,
          [sessionId],
        );
        const matchedCount = countResult.rows[0]?.count ?? 0;
        if (matchedCount >= session.expectedMatches) {
          await client.query(
            `UPDATE training_sessions
             SET status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND user_id = $2 AND status = 'IN_PROGRESS'`,
            [sessionId, userId],
          );
        }
      }

      const refreshed = await client.query<SessionRow>(
        `${SESSION_SELECT} WHERE s.id = $1 AND s.user_id = $2`,
        [sessionId, userId],
      );
      await client.query("COMMIT");
      const row = refreshed.rows[0];
      return row ? toSnapshot(row) : null;
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }
}
