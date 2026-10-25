import type { Pool, QueryResultRow } from "pg";
import type {
  JsonObject,
  LocalizedText,
  PublishedMediaAsset,
  PublishedModuleDetails,
  PublishedModuleSummary,
  PublishedQSetDetails,
  PublishedSubmoduleQSets,
  QSetQuestion,
  QSetSummary,
  SubmoduleSummary,
  TrainingContentRepository,
} from "../../../domain/training/TrainingContentRepository.js";

type ModuleRow = QueryResultRow & {
  id: string;
  slug: string;
  versionId: string;
  versionNumber: number;
  title: LocalizedText;
  description: LocalizedText;
  supportedLanguages: string[];
  submoduleCount: number;
};

type SubmoduleRow = QueryResultRow & {
  id: string;
  slug: string;
  exerciseType: SubmoduleSummary["exerciseType"];
  name: LocalizedText;
  instructions: LocalizedText;
  iconName: string;
  position: number;
  qSetCount: number;
};

type QSetListRow = QueryResultRow & {
  submoduleId: string;
  submoduleSlug: string;
  exerciseType: SubmoduleSummary["exerciseType"];
  name: LocalizedText;
  instructions: LocalizedText;
  iconName: string;
  submodulePosition: number;
  qSetId: string | null;
  title: LocalizedText | null;
  difficultyIndex: number | null;
  position: number | null;
  questionCount: number | null;
};

type QSetRow = QueryResultRow & {
  id: string;
  submoduleId: string;
  title: LocalizedText;
  difficultyIndex: number;
  position: number;
  rewardPoolPoints: number;
  slug: string;
  exerciseType: SubmoduleSummary["exerciseType"];
  name: LocalizedText;
  instructions: LocalizedText;
  iconName: string;
};

type QuestionRow = QueryResultRow & {
  id: string;
  position: number;
  content: JsonObject;
};

type QuestionMediaRow = QueryResultRow & {
  questionId: string;
  id: string;
  role: QSetQuestion["media"][number]["role"];
  position: number;
  mimeType: string;
  altText: LocalizedText;
};

type MediaAssetRow = QueryResultRow & {
  id: string;
  storageKey: string;
  mimeType: string;
};

const PUBLISHED_MODULE_FILTER = `
  mv.status = 'published'
  AND tm.archived_at IS NULL
`;

export class PgTrainingContentRepository implements TrainingContentRepository {
  constructor(private readonly pool: Pool) {}

  async listPublishedModules(): Promise<PublishedModuleSummary[]> {
    const result = await this.pool.query<ModuleRow>(
      `SELECT
         tm.id,
         tm.slug,
         mv.id AS "versionId",
         mv.version_number AS "versionNumber",
         mv.title,
         mv.description,
         mv.supported_languages AS "supportedLanguages",
         COUNT(DISTINCT s.id)::int AS "submoduleCount"
       FROM training_modules tm
       JOIN module_versions mv ON mv.module_id = tm.id
       LEFT JOIN submodules s ON s.module_version_id = mv.id
       WHERE ${PUBLISHED_MODULE_FILTER}
       GROUP BY tm.id, tm.slug, mv.id, mv.version_number,
                mv.title, mv.description, mv.supported_languages
       ORDER BY tm.created_at, mv.title->>'en'`,
    );
    return result.rows;
  }

  async getPublishedModuleById(moduleId: string): Promise<PublishedModuleDetails | null> {
    const moduleResult = await this.pool.query<ModuleRow>(
      `SELECT
         tm.id,
         tm.slug,
         mv.id AS "versionId",
         mv.version_number AS "versionNumber",
         mv.title,
         mv.description,
         mv.supported_languages AS "supportedLanguages",
         COUNT(DISTINCT s.id)::int AS "submoduleCount"
       FROM training_modules tm
       JOIN module_versions mv ON mv.module_id = tm.id
       LEFT JOIN submodules s ON s.module_version_id = mv.id
       WHERE tm.id = $1 AND ${PUBLISHED_MODULE_FILTER}
       GROUP BY tm.id, tm.slug, mv.id, mv.version_number,
                mv.title, mv.description, mv.supported_languages
       LIMIT 1`,
      [moduleId],
    );
    const module = moduleResult.rows[0];
    if (!module) return null;

    const submodulesResult = await this.pool.query<SubmoduleRow>(
      `SELECT
         s.id,
         s.slug,
         s.exercise_type AS "exerciseType",
         s.name,
         s.instructions,
         s.icon_name AS "iconName",
         s.position,
         COUNT(DISTINCT qs.id)::int AS "qSetCount"
       FROM submodules s
       LEFT JOIN q_sets qs ON qs.submodule_id = s.id
       WHERE s.module_version_id = $1
       GROUP BY s.id, s.slug, s.exercise_type, s.name,
                s.instructions, s.icon_name, s.position
       ORDER BY s.position`,
      [module.versionId],
    );

    return { ...module, submodules: submodulesResult.rows };
  }

  async listQSetsBySubmoduleId(submoduleId: string): Promise<PublishedSubmoduleQSets | null> {
    const result = await this.pool.query<QSetListRow>(
      `SELECT
         s.id AS "submoduleId",
         s.slug AS "submoduleSlug",
         s.exercise_type AS "exerciseType",
         s.name,
         s.instructions,
         s.icon_name AS "iconName",
         s.position AS "submodulePosition",
         qs.id AS "qSetId",
         qs.title,
         qs.difficulty_index AS "difficultyIndex",
         qs.position,
         COUNT(q.id)::int AS "questionCount"
       FROM submodules s
       JOIN module_versions mv ON mv.id = s.module_version_id
       JOIN training_modules tm ON tm.id = mv.module_id
       LEFT JOIN q_sets qs ON qs.submodule_id = s.id
       LEFT JOIN questions q ON q.q_set_id = qs.id AND q.is_active = TRUE
       WHERE s.id = $1 AND ${PUBLISHED_MODULE_FILTER}
       GROUP BY s.id, s.slug, s.exercise_type, s.name, s.instructions,
                s.icon_name, s.position, qs.id, qs.title,
                qs.difficulty_index, qs.position
       ORDER BY qs.position`,
      [submoduleId],
    );
    if (result.rows.length === 0) return null;

    const first = result.rows[0];
    const qSets: QSetSummary[] = result.rows
      .filter((row): row is QSetListRow & { qSetId: string; title: LocalizedText; difficultyIndex: number; position: number; questionCount: number } =>
        row.qSetId !== null && row.title !== null && row.difficultyIndex !== null && row.position !== null && row.questionCount !== null)
      .map((row) => ({
        id: row.qSetId,
        submoduleId: row.submoduleId,
        title: row.title,
        difficultyIndex: row.difficultyIndex,
        position: row.position,
        questionCount: row.questionCount,
      }));

    return {
      submodule: {
        id: first.submoduleId,
        slug: first.submoduleSlug,
        exerciseType: first.exerciseType,
        name: first.name,
        instructions: first.instructions,
        iconName: first.iconName,
        position: first.submodulePosition,
      },
      qSets,
    };
  }

  async getPublishedQSetById(qSetId: string): Promise<PublishedQSetDetails | null> {
    const qSetResult = await this.pool.query<QSetRow>(
      `SELECT
         qs.id,
         qs.submodule_id AS "submoduleId",
         qs.title,
         qs.difficulty_index AS "difficultyIndex",
         qs.position,
         mv.reward_pool_points AS "rewardPoolPoints",
         s.slug,
         s.exercise_type AS "exerciseType",
         s.name,
         s.instructions,
         s.icon_name AS "iconName"
       FROM q_sets qs
       JOIN submodules s ON s.id = qs.submodule_id
       JOIN module_versions mv ON mv.id = s.module_version_id
       JOIN training_modules tm ON tm.id = mv.module_id
       WHERE qs.id = $1 AND ${PUBLISHED_MODULE_FILTER}
       LIMIT 1`,
      [qSetId],
    );
    const qSet = qSetResult.rows[0];
    if (!qSet) return null;

    const questionResult = await this.pool.query<QuestionRow>(
      `SELECT id, position, content
       FROM questions
       WHERE q_set_id = $1 AND is_active = TRUE
       ORDER BY position`,
      [qSetId],
    );
    const questions = questionResult.rows;
    const questionIds = questions.map((question) => question.id);

    let mediaRows: QuestionMediaRow[] = [];
    if (questionIds.length > 0) {
      const mediaResult = await this.pool.query<QuestionMediaRow>(
        `SELECT
           qm.question_id AS "questionId",
           ma.id,
           qm.role,
           qm.position,
           ma.mime_type AS "mimeType",
           ma.alt_text AS "altText"
         FROM question_media qm
         JOIN media_assets ma ON ma.id = qm.asset_id AND ma.is_active = TRUE
         WHERE qm.question_id = ANY($1::uuid[])
         ORDER BY qm.question_id, qm.position, qm.role`,
        [questionIds],
      );
      mediaRows = mediaResult.rows;
    }

    const mappedQuestions: QSetQuestion[] = questions.map((question) => ({
      ...question,
      media: mediaRows
        .filter((media) => media.questionId === question.id)
        .map(({ id, role, position, mimeType, altText }) => ({ id, role, position, mimeType, altText })),
    }));

    return {
      id: qSet.id,
      submoduleId: qSet.submoduleId,
      title: qSet.title,
      difficultyIndex: qSet.difficultyIndex,
      position: qSet.position,
      rewardPoolPoints: qSet.rewardPoolPoints,
      submodule: {
        id: qSet.submoduleId,
        slug: qSet.slug,
        exerciseType: qSet.exerciseType,
        name: qSet.name,
        instructions: qSet.instructions,
        iconName: qSet.iconName,
      },
      questions: mappedQuestions,
    };
  }

  async getPublishedMediaAssetById(assetId: string): Promise<PublishedMediaAsset | null> {
    const result = await this.pool.query<MediaAssetRow>(
      `SELECT DISTINCT ma.id, ma.storage_key AS "storageKey", ma.mime_type AS "mimeType"
       FROM media_assets ma
       JOIN question_media qm ON qm.asset_id = ma.id
       JOIN questions q ON q.id = qm.question_id AND q.is_active = TRUE
       JOIN q_sets qs ON qs.id = q.q_set_id
       JOIN submodules s ON s.id = qs.submodule_id
       JOIN module_versions mv ON mv.id = s.module_version_id
       JOIN training_modules tm ON tm.id = mv.module_id
       WHERE ma.id = $1 AND ma.is_active = TRUE AND ${PUBLISHED_MODULE_FILTER}
       LIMIT 1`,
      [assetId],
    );
    return result.rows[0] ?? null;
  }
}
