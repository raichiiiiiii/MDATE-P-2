import type { Pool, PoolClient, QueryResultRow } from "pg";

import type {
  AccountSnapshot,
  AccountSetupInput,
  BootstrapResult,
} from "../../../domain/identity/Account.js";

import type { AccountRepository } from "../../../domain/identity/AccountRepository.js";

type DatabaseExecutor = Pool | PoolClient;

type AccountRow = QueryResultRow & {
  id: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  preferredLanguage: string;
  status: AccountSnapshot["status"];
  setupCompletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  roles: string[] | null;
  textSize: AccountSnapshot["accessibilityPreferences"]["textSize"];
  contrast: AccountSnapshot["accessibilityPreferences"]["contrast"];
  alternativeInputOn: boolean;
  preferredVoiceId: string | null;
  audioRate: string | number;
  audioVolume: string | number;
  voiceDisabled: boolean;
};

const ACCOUNT_BY_SUBJECT_SQL = `
  SELECT
    u.id,
    u.email,
    u.email_verified AS "emailVerified",
    u.display_name AS "displayName",
    u.preferred_language AS "preferredLanguage",
    u.status,
    u.setup_completed_at AS "setupCompletedAt",
    u.created_at AS "createdAt",
    u.updated_at AS "updatedAt",

    COALESCE((
      SELECT json_agg(r.name ORDER BY r.name)
      FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = u.id
    ), '[]'::json) AS roles,

    COALESCE(ap.text_size, 'medium') AS "textSize",
    COALESCE(ap.contrast, 'normal') AS contrast,
    COALESCE(ap.alternative_input_on, FALSE) AS "alternativeInputOn",

    vp.preferred_voice_id AS "preferredVoiceId",
    COALESCE(vp.audio_rate, 1.00) AS "audioRate",
    COALESCE(vp.audio_volume, 1.00) AS "audioVolume",
    COALESCE(vp.voice_disabled, FALSE) AS "voiceDisabled"

  FROM users u
  JOIN oauth_providers op ON op.user_id = u.id
  LEFT JOIN accessibility_preferences ap ON ap.user_id = u.id
  LEFT JOIN voice_preferences vp ON vp.user_id = u.id

  WHERE op.provider = 'auth0'
    AND op.provider_user_id = $1

  LIMIT 1
`;

function toSnapshot(row: AccountRow): AccountSnapshot {
  return {
    id: row.id,
    email: row.email,
    emailVerified: row.emailVerified,
    displayName: row.displayName,
    preferredLanguage: row.preferredLanguage,
    status: row.status,
    setupCompletedAt: row.setupCompletedAt
      ? new Date(row.setupCompletedAt).toISOString()
      : null,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
    roles: row.roles ?? [],

    accessibilityPreferences: {
      textSize: row.textSize,
      contrast: row.contrast,
      alternativeInputOn: row.alternativeInputOn,
    },

    voicePreferences: {
      preferredVoiceId: row.preferredVoiceId,
      audioRate: Number(row.audioRate),
      audioVolume: Number(row.audioVolume),
      voiceDisabled: row.voiceDisabled,
    },
  };
}

async function selectBySubject(
  db: DatabaseExecutor,
  subject: string
): Promise<AccountSnapshot | null> {
  const result = await db.query<AccountRow>(
    ACCOUNT_BY_SUBJECT_SQL,
    [subject]
  );

  return result.rows[0] ? toSnapshot(result.rows[0]) : null;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}

export class PgAccountRepository implements AccountRepository {
  constructor(private readonly pool: Pool) {}

  async findByAuth0Subject(
    auth0Subject: string
  ): Promise<AccountSnapshot | null> {
    return selectBySubject(this.pool, auth0Subject);
  }

  async bootstrap(auth0Subject: string): Promise<BootstrapResult> {
    const existing = await this.findByAuth0Subject(auth0Subject);

    if (existing) {
      return { account: existing, created: false };
    }

    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      // Recheck inside the transaction. Another request may have
      // provisioned this identity after the first lookup.
      const concurrentAccount = await selectBySubject(
        client,
        auth0Subject
      );

      if (concurrentAccount) {
        await client.query("COMMIT");
        return { account: concurrentAccount, created: false };
      }

      const userResult = await client.query<{ id: string }>(
        `INSERT INTO users DEFAULT VALUES RETURNING id`
      );

      const userId = userResult.rows[0]?.id;

      if (!userId) {
        throw new Error("Failed to create the MDATE account.");
      }

      await client.query(
        `INSERT INTO oauth_providers
           (user_id, provider, provider_user_id)
         VALUES ($1, 'auth0', $2)`,
        [userId, auth0Subject]
      );

      const roleResult = await client.query<{ id: number }>(
        `SELECT id FROM roles WHERE name = 'patient' LIMIT 1`
      );

      const patientRoleId = roleResult.rows[0]?.id;

      if (patientRoleId === undefined) {
        throw new Error(
          "The patient role is missing. Seed the roles table first."
        );
      }

      await client.query(
        `INSERT INTO user_roles (user_id, role_id)
         VALUES ($1, $2)`,
        [userId, patientRoleId]
      );

      const account = await selectBySubject(client, auth0Subject);

      if (!account) {
        throw new Error("Failed to retrieve the created MDATE account.");
      }

      await client.query("COMMIT");

      return { account, created: true };
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);

      // Two simultaneous bootstrap requests can race on the unique
      // provider/subject constraint. Return the account that won.
      if (isUniqueViolation(error)) {
        const account = await this.findByAuth0Subject(auth0Subject);

        if (account) {
          return { account, created: false };
        }
      }

      throw error;
    } finally {
      client.release();
    }
  }

  async completeSetup(
    auth0Subject: string,
    input: AccountSetupInput
  ): Promise<AccountSnapshot | null> {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      const updatedUser = await client.query<{ id: string }>(
        `UPDATE users AS u
         SET display_name = $2,
             preferred_language = $3,
             status = 'ACTIVE',
             setup_completed_at =
               COALESCE(u.setup_completed_at, CURRENT_TIMESTAMP),
             updated_at = CURRENT_TIMESTAMP
         FROM oauth_providers AS op
         WHERE op.user_id = u.id
           AND op.provider = 'auth0'
           AND op.provider_user_id = $1
           AND u.status IN ('PENDING_SETUP', 'ACTIVE')
           AND u.deleted_at IS NULL
         RETURNING u.id`,
        [
          auth0Subject,
          input.displayName,
          input.preferredLanguage,
        ]
      );

      const userId = updatedUser.rows[0]?.id;

      if (!userId) {
        await client.query("ROLLBACK");
        return null;
      }

      await client.query(
        `INSERT INTO accessibility_preferences (
           user_id, text_size, contrast, alternative_input_on, updated_at
         )
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id) DO UPDATE SET
           text_size = EXCLUDED.text_size,
           contrast = EXCLUDED.contrast,
           alternative_input_on = EXCLUDED.alternative_input_on,
           updated_at = CURRENT_TIMESTAMP`,
        [
          userId,
          input.accessibilityPreferences.textSize,
          input.accessibilityPreferences.contrast,
          input.accessibilityPreferences.alternativeInputOn,
        ]
      );

      await client.query(
        `INSERT INTO voice_preferences (
           user_id, preferred_voice_id, audio_rate,
           audio_volume, voice_disabled, updated_at
         )
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id) DO UPDATE SET
           preferred_voice_id = EXCLUDED.preferred_voice_id,
           audio_rate = EXCLUDED.audio_rate,
           audio_volume = EXCLUDED.audio_volume,
           voice_disabled = EXCLUDED.voice_disabled,
           updated_at = CURRENT_TIMESTAMP`,
        [
          userId,
          input.voicePreferences.preferredVoiceId,
          input.voicePreferences.audioRate,
          input.voicePreferences.audioVolume,
          input.voicePreferences.voiceDisabled,
        ]
      );

      const account = await selectBySubject(client, auth0Subject);

      if (!account) {
        throw new Error("Failed to retrieve the updated MDATE account.");
      }

      await client.query("COMMIT");

      return account;
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }
}
