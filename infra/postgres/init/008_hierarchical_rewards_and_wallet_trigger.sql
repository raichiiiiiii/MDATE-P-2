BEGIN;

-- A wallet is provisioned in the same transaction as every user insert.
-- This runs after migration/init 007 has created user_wallets.
CREATE OR REPLACE FUNCTION fn_init_user_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO user_wallets (user_id, balance, lifetime_earned, updated_at)
  VALUES (NEW.id, 0, 0, NOW())
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_init_wallet ON users;
CREATE TRIGGER trg_users_init_wallet
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION fn_init_user_wallet();

-- Backfill accounts created before this trigger was installed.
INSERT INTO user_wallets (user_id, balance, lifetime_earned, updated_at)
SELECT id, 0, 0, NOW()
FROM users
ON CONFLICT (user_id) DO NOTHING;

-- The actual logical module content is versioned in module_versions.
-- There is no `modules` table in this repository.
ALTER TABLE module_versions
  ADD COLUMN IF NOT EXISTS reward_coins INTEGER NOT NULL DEFAULT 100;

ALTER TABLE module_versions
  DROP CONSTRAINT IF EXISTS module_versions_reward_coins_check;
ALTER TABLE module_versions
  ADD CONSTRAINT module_versions_reward_coins_check
  CHECK (reward_coins >= 0);

-- Keep the legacy exercise_type for compatibility, but use game_mode as the
-- stable engine selector consumed by the new Expo registry.
ALTER TABLE submodules
  ADD COLUMN IF NOT EXISTS game_mode VARCHAR(64) NOT NULL DEFAULT 'standard_qset';

UPDATE submodules
SET game_mode = CASE exercise_type
  WHEN 'find_the_pair' THEN 'find_the_pair'
  WHEN 'try_to_guess' THEN 'challenge'
  WHEN 'tell_me_more' THEN 'story_telling'
  ELSE 'standard_qset'
END
WHERE game_mode = 'standard_qset';

ALTER TABLE submodules
  DROP CONSTRAINT IF EXISTS submodules_game_mode_check;
ALTER TABLE submodules
  ADD CONSTRAINT submodules_game_mode_check
  CHECK (game_mode IN ('find_the_pair', 'challenge', 'story_telling', 'standard_qset'));

-- q_sets already stores difficulty in difficulty_index. Retain that column to
-- avoid breaking existing seed scripts/API clients, but permit multiple QSets
-- in the same difficulty tier (required by the Fibonacci grouping algorithm).
ALTER TABLE q_sets
  DROP CONSTRAINT IF EXISTS q_sets_submodule_id_difficulty_index_key;
CREATE INDEX IF NOT EXISTS idx_q_sets_submodule_difficulty
  ON q_sets (submodule_id, difficulty_index ASC, id ASC);

-- Pin game mode and calculated question rewards at session creation. A module
-- edit after a session starts must not change the reward earned by that session.
ALTER TABLE training_sessions
  ADD COLUMN IF NOT EXISTS game_mode VARCHAR(64) NOT NULL DEFAULT 'standard_qset';

ALTER TABLE training_sessions
  DROP CONSTRAINT IF EXISTS training_sessions_game_mode_check;
ALTER TABLE training_sessions
  ADD CONSTRAINT training_sessions_game_mode_check
  CHECK (game_mode IN ('find_the_pair', 'challenge', 'story_telling', 'standard_qset'));

ALTER TABLE training_session_questions
  ADD COLUMN IF NOT EXISTS reward_coins INTEGER NOT NULL DEFAULT 0;

ALTER TABLE training_session_questions
  DROP CONSTRAINT IF EXISTS training_session_questions_reward_coins_check;
ALTER TABLE training_session_questions
  ADD CONSTRAINT training_session_questions_reward_coins_check
  CHECK (reward_coins >= 0);

-- Non-pair engines persist one outcome per question. `earned_coins` is
-- intentionally absent: the server derives rewards from the pinned snapshot.
CREATE TABLE IF NOT EXISTS training_session_question_results (
  session_id UUID NOT NULL,
  question_id UUID NOT NULL,
  is_correct BOOLEAN NOT NULL,
  attempts INTEGER NOT NULL CHECK (attempts >= 1),
  duration_ms INTEGER NOT NULL CHECK (duration_ms >= 0),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (session_id, question_id),
  CONSTRAINT fk_training_result_session_question
    FOREIGN KEY (session_id, question_id)
    REFERENCES training_session_questions(session_id, question_id)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_training_question_results_session
  ON training_session_question_results (session_id, submitted_at);

COMMIT;
