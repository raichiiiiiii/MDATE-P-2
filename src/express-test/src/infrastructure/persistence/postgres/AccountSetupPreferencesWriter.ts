import type { PoolClient } from "pg";
import type { AccountSetupPreferencesInput } from "../../../application/account-setup/accountSetupPreferences.js";

/**
 * Writes preference fields using the caller's existing PostgreSQL transaction.
 * Invoke this with the PoolClient already used by CompleteAccountSetup; do not
 * pass the pool itself, or the user update and preference rows can diverge.
 * `userId` must be the internal users.id UUID resolved by the backend, never
 * the client-submitted value or the Auth0 `sub` string.
 */
export async function writeAccountSetupPreferences(
  client: PoolClient,
  userId: string,
  input: AccountSetupPreferencesInput,
): Promise<void> {
  await client.query(
    `INSERT INTO accessibility_preferences
       (user_id, text_size, contrast, alternative_input_on, updated_at)
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
    ],
  );

  await client.query(
    `INSERT INTO voice_preferences
       (user_id, preferred_voice_id, audio_rate, audio_volume, voice_disabled, updated_at)
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
    ],
  );
}
