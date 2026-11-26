import type { Pool, QueryResultRow } from "pg";
import type { PublishedRewardTree, TrainingRewardRepository, TrainingRewardSubmodule } from "../../../domain/training/TrainingRewardRepository.js";
import type { GameModeId } from "../../../domain/training/TrainingGameMode.js";
import {
  calculateModuleRewardTree,
  type RewardModuleTree,
  type RewardModuleInput,
  type RewardSubmoduleInput,
  type RewardQSetInput,
  type RewardQuestionInput,
} from "../../../domain/training/RewardCalculator.js";



type TreeRow = QueryResultRow & {
  moduleId: string;
  moduleVersionId: string;
  versionNumber: number;
  slug: string;
  title: Record<string, string>;
  rewardCoins: number;
  submoduleId: string | null;
  submoduleSlug: string | null;
  gameMode: GameModeId | null;
  exerciseType: TrainingRewardSubmodule["exerciseType"] | null;
  name: Record<string, string> | null;
  instructions: Record<string, string> | null;
  iconName: string | null;
  submodulePosition: number | null;
  qSetId: string | null;
  qSetTitle: Record<string, string> | null;
  difficulty: number | null;
  qSetPosition: number | null;
  questionId: string | null;
  questionPosition: number | null;
};

export class PgTrainingRewardRepository implements TrainingRewardRepository {
  constructor(private readonly pool: Pool) {}

  async getModuleRewardTree(moduleId: string): Promise<PublishedRewardTree | null> {
    const version = await this.pool.query<{ versionId: string }>(
      `SELECT mv.id AS "versionId"
       FROM training_modules tm
       JOIN module_versions mv ON mv.module_id = tm.id
       WHERE tm.id = $1 AND mv.status = 'published' AND tm.archived_at IS NULL
       LIMIT 1`,
      [moduleId],
    );
    const versionId = version.rows[0]?.versionId;
    return versionId ? this.loadTree(versionId) : null;
  }

  async getSubmoduleRewardTree(submoduleId: string): Promise<PublishedRewardTree | null> {
    const version = await this.pool.query<{ versionId: string }>(
      `SELECT mv.id AS "versionId"
       FROM submodules s
       JOIN module_versions mv ON mv.id = s.module_version_id
       JOIN training_modules tm ON tm.id = mv.module_id
       WHERE s.id = $1 AND mv.status = 'published' AND tm.archived_at IS NULL
       LIMIT 1`,
      [submoduleId],
    );
    const versionId = version.rows[0]?.versionId;
    return versionId ? this.loadTree(versionId) : null;
  }

  private async loadTree(versionId: string): Promise<PublishedRewardTree | null> {
    const result = await this.pool.query<TreeRow>(
      `SELECT
         tm.id AS "moduleId",
         mv.id AS "moduleVersionId",
         mv.version_number AS "versionNumber",
         tm.slug,
         mv.title,
         mv.reward_coins AS "rewardCoins",
         s.id AS "submoduleId",
         s.slug AS "submoduleSlug",
         s.game_mode AS "gameMode",
         s.exercise_type AS "exerciseType",
         s.name,
         s.instructions,
         s.icon_name AS "iconName",
         s.position AS "submodulePosition",
         qs.id AS "qSetId",
         qs.title AS "qSetTitle",
         qs.difficulty_index AS difficulty,
         qs.position AS "qSetPosition",
         q.id AS "questionId",
         q.position AS "questionPosition"
       FROM module_versions mv
       JOIN training_modules tm ON tm.id = mv.module_id
       LEFT JOIN submodules s ON s.module_version_id = mv.id
       LEFT JOIN q_sets qs ON qs.submodule_id = s.id
       LEFT JOIN questions q ON q.q_set_id = qs.id AND q.is_active = TRUE
       WHERE mv.id = $1 AND mv.status = 'published' AND tm.archived_at IS NULL
       ORDER BY s.position, qs.difficulty_index, qs.id, q.position, q.id`,
      [versionId],
    );

    const first = result.rows[0];
    if (!first) return null;

    const moduleInput: RewardModuleInput = {
      id: first.moduleVersionId,
      moduleVersionId: first.moduleVersionId,
      rewardCoins: Number(first.rewardCoins),
    };

    const submoduleMap = new Map<string, RewardSubmoduleInput>();
    const qSetMap = new Map<string, RewardQSetInput>();
    const questionMap = new Map<string, RewardQuestionInput>();

    const submoduleMetadata = new Map<string, Omit<TrainingRewardSubmodule, "questionCount" | "inheritedRewardCoins" | "qSets">>();
    const qSetMetadata = new Map<string, { title: Record<string, string>; submoduleId: string }>();

    for (const row of result.rows) {
      if (!row.submoduleId) continue;
      submoduleMap.set(row.submoduleId, { id: row.submoduleId, moduleId: moduleInput.id });
      submoduleMetadata.set(row.submoduleId, {
        id: row.submoduleId,
        slug: row.submoduleSlug ?? "",
        gameMode: row.gameMode ?? "standard_qset",
        exerciseType: row.exerciseType ?? "try_to_guess",
        name: row.name ?? {},
        instructions: row.instructions ?? {},
        iconName: row.iconName ?? "puzzle",
        position: Number(row.submodulePosition ?? 0),
      });
      if (!row.qSetId || row.difficulty === null || row.qSetPosition === null) continue;
      qSetMap.set(row.qSetId, {
        id: row.qSetId,
        submoduleId: row.submoduleId,
        difficulty: Number(row.difficulty),
        position: Number(row.qSetPosition),
      });
      qSetMetadata.set(row.qSetId, {
        title: row.qSetTitle ?? {},
        submoduleId: row.submoduleId,
      });
      if (row.questionId && row.questionPosition !== null) {
        questionMap.set(row.questionId, {
          id: row.questionId,
          qSetId: row.qSetId,
          position: Number(row.questionPosition),
          isActive: true,
        });
      }
    }

    const calculated: RewardModuleTree = calculateModuleRewardTree(
      moduleInput,
      [...submoduleMap.values()],
      [...qSetMap.values()],
      [...questionMap.values()],
    );

    const submodules: TrainingRewardSubmodule[] = calculated.submodules.map((allocated) => {
      const metadata = submoduleMetadata.get(allocated.id)!;
      return {
        ...metadata,
        questionCount: allocated.questionCount,
        inheritedRewardCoins: allocated.inheritedRewardCoins,
        qSets: allocated.qSets.map((qSet) => ({
          id: qSet.id,
          title: qSetMetadata.get(qSet.id)?.title ?? {},
          difficulty: qSet.difficulty,
          position: qSet.position,
          fibonacciWeight: qSet.fibonacciWeight,
          questionCount: qSet.questionCount,
          inheritedRewardCoins: qSet.inheritedRewardCoins,
          questions: qSet.questions.map((question) => ({
            id: question.id,
            position: question.questionOrder,
            rewardCoins: question.rewardCoins,
          })),
        })),
      };
    });

    return {
      module: {
        id: first.moduleId,
        versionId: first.moduleVersionId,
        versionNumber: Number(first.versionNumber),
        slug: first.slug,
        title: first.title ?? {},
        rewardCoins: Number(first.rewardCoins),
      },
      questionCount: calculated.questionCount,
      allocatedCoins: calculated.allocatedCoins,
      unallocatedCoins: calculated.unallocatedCoins,
      submodules,
    };
  }
}
