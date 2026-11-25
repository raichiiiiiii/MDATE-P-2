BEGIN;

-- Wallet balance is a materialized view of the immutable coin ledger.
CREATE TABLE IF NOT EXISTS user_wallets (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  lifetime_earned INTEGER NOT NULL DEFAULT 0 CHECK (lifetime_earned >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  amount INTEGER NOT NULL CHECK (amount <> 0),
  balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
  type VARCHAR(32) NOT NULL CHECK (type IN ('CREDIT', 'DEBIT')),
  reason VARCHAR(64) NOT NULL CHECK (reason IN ('SESSION_COMPLETE', 'DAILY_CHECKIN', 'STORE_REDEEM', 'ADMIN_ADJUSTMENT')),
  reference_id VARCHAR(128) NULL,
  idempotency_key VARCHAR(128) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_coin_tx_user_idempotency UNIQUE (user_id, idempotency_key),
  CONSTRAINT ck_coin_tx_direction CHECK (
    (type = 'CREDIT' AND amount > 0) OR (type = 'DEBIT' AND amount < 0)
  ),
  CONSTRAINT ck_coin_tx_idempotency_key CHECK (length(trim(idempotency_key)) BETWEEN 8 AND 128),
  CONSTRAINT ck_coin_tx_reason_direction CHECK (
    (reason IN ('SESSION_COMPLETE', 'DAILY_CHECKIN') AND type = 'CREDIT')
    OR (reason = 'STORE_REDEEM' AND type = 'DEBIT' AND reference_id IS NOT NULL)
    OR reason = 'ADMIN_ADJUSTMENT'
  ),
  CONSTRAINT ck_coin_tx_session_reference CHECK (reason <> 'SESSION_COMPLETE' OR reference_id IS NOT NULL),
  CONSTRAINT ck_coin_tx_daily_reference CHECK (reason <> 'DAILY_CHECKIN' OR reference_id IS NULL)
);

CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_created
  ON coin_transactions (user_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_reason_created
  ON coin_transactions (user_id, reason, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_coin_transactions_session_reward
  ON coin_transactions (user_id, reference_id)
  WHERE reason = 'SESSION_COMPLETE';

-- Reward amounts and limits are configuration controlled by the server/database.
CREATE TABLE IF NOT EXISTS coin_reward_rules (
  reason VARCHAR(64) PRIMARY KEY CHECK (reason IN ('SESSION_COMPLETE', 'DAILY_CHECKIN')),
  amount INTEGER NOT NULL CHECK (amount > 0),
  max_claims_per_utc_day INTEGER NOT NULL CHECK (max_claims_per_utc_day > 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO coin_reward_rules (reason, amount, max_claims_per_utc_day, is_active)
VALUES ('SESSION_COMPLETE', 25, 5, TRUE), ('DAILY_CHECKIN', 10, 1, TRUE)
ON CONFLICT (reason) DO NOTHING;

CREATE TABLE IF NOT EXISTS coin_store_items (
  item_id VARCHAR(128) PRIMARY KEY,
  name JSONB NOT NULL CHECK (jsonb_typeof(name) = 'object'),
  category VARCHAR(64) NOT NULL,
  cost INTEGER NOT NULL CHECK (cost > 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (length(trim(item_id)) > 0),
  CHECK (length(trim(category)) > 0)
);
INSERT INTO coin_store_items (item_id, name, category, cost, is_active)
VALUES
  ('theme-ocean-calm', '{"ms":"Tema Laut Tenang","en":"Ocean Calm Theme"}'::jsonb, 'theme', 200, TRUE)
ON CONFLICT (item_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS user_coin_unlocks (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  item_id VARCHAR(128) NOT NULL REFERENCES coin_store_items(item_id) ON DELETE RESTRICT,
  transaction_id UUID NOT NULL UNIQUE REFERENCES coin_transactions(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, item_id)
);

-- Session evidence is separate from wallet accounting. Only published Find the Pair
-- content with exactly two QSets and five active questions per set can be started.
CREATE TABLE IF NOT EXISTS training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  submodule_id UUID NOT NULL REFERENCES submodules(id) ON DELETE RESTRICT,
  expected_matches INTEGER NOT NULL CHECK (expected_matches > 0),
  status VARCHAR(24) NOT NULL DEFAULT 'IN_PROGRESS'
    CHECK (status IN ('IN_PROGRESS', 'COMPLETED')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ NULL,
  reward_claimed_at TIMESTAMPTZ NULL,
  CHECK (
    (status = 'IN_PROGRESS' AND completed_at IS NULL)
    OR (status = 'COMPLETED' AND completed_at IS NOT NULL)
  )
);
CREATE INDEX IF NOT EXISTS idx_training_sessions_user_started
  ON training_sessions (user_id, started_at DESC);

CREATE TABLE IF NOT EXISTS training_session_questions (
  session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE RESTRICT,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
  PRIMARY KEY (session_id, question_id)
);

CREATE TABLE IF NOT EXISTS training_session_matches (
  session_id UUID NOT NULL,
  question_id UUID NOT NULL,
  matched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (session_id, question_id),
  CONSTRAINT fk_training_match_session_question
    FOREIGN KEY (session_id, question_id)
    REFERENCES training_session_questions(session_id, question_id) ON DELETE RESTRICT
);

-- Ledger corrections must be represented by a compensating transaction, never edits.
CREATE OR REPLACE FUNCTION reject_coin_transaction_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'coin_transactions is append-only; create a compensating transaction instead.'
    USING ERRCODE = '55000';
END;
$$;
DROP TRIGGER IF EXISTS trg_coin_transactions_append_only ON coin_transactions;
CREATE TRIGGER trg_coin_transactions_append_only
  BEFORE UPDATE OR DELETE ON coin_transactions
  FOR EACH ROW EXECUTE FUNCTION reject_coin_transaction_mutation();
DROP TRIGGER IF EXISTS trg_coin_transactions_no_truncate ON coin_transactions;
CREATE TRIGGER trg_coin_transactions_no_truncate
  BEFORE TRUNCATE ON coin_transactions
  FOR EACH STATEMENT EXECUTE FUNCTION reject_coin_transaction_mutation();

COMMIT;
