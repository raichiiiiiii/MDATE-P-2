BEGIN;

-- Local MDATE credentials. Existing users and their UUIDs/foreign keys remain intact.
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT NULL;

-- Normalize existing email addresses so registration/login lookups are case-insensitive.
-- Review duplicate addresses before applying this migration; the following update
-- intentionally does not merge users or rewrite their UUIDs.
UPDATE users
SET email = lower(btrim(email))
WHERE email IS NOT NULL AND email IS DISTINCT FROM lower(btrim(email));

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_uq
  ON users (lower(email)) WHERE email IS NOT NULL AND deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS refresh_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_id UUID NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ NULL,
  replaced_by_hash TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (length(token_hash) = 64)
);
CREATE INDEX IF NOT EXISTS refresh_sessions_user_idx ON refresh_sessions(user_id);
CREATE INDEX IF NOT EXISTS refresh_sessions_family_idx ON refresh_sessions(family_id);
CREATE INDEX IF NOT EXISTS refresh_sessions_expiry_idx ON refresh_sessions(expires_at);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (length(token_hash) = 64)
);
CREATE INDEX IF NOT EXISTS password_reset_user_idx ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS password_reset_expiry_idx ON password_reset_tokens(expires_at);

COMMIT;
