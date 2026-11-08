BEGIN;

-- Profile metadata lives on users; image bytes remain in private object storage.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS avatar_storage_key TEXT NULL,
  ADD COLUMN IF NOT EXISTS avatar_content_type TEXT NULL,
  ADD COLUMN IF NOT EXISTS avatar_updated_at TIMESTAMPTZ NULL;

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_avatar_content_type_check;
ALTER TABLE users
  ADD CONSTRAINT users_avatar_content_type_check
  CHECK (avatar_content_type IS NULL OR avatar_content_type IN ('image/jpeg', 'image/png', 'image/webp'));
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_avatar_metadata_consistency_check;
ALTER TABLE users
  ADD CONSTRAINT users_avatar_metadata_consistency_check
  CHECK (
    (avatar_storage_key IS NULL AND avatar_content_type IS NULL AND avatar_updated_at IS NULL)
    OR (avatar_storage_key IS NOT NULL AND avatar_content_type IS NOT NULL AND avatar_updated_at IS NOT NULL)
  );

-- Server-minted, short-lived upload tickets. The object key is never selected
-- from client input and an intent can be confirmed only once by its owner.
CREATE TABLE IF NOT EXISTS avatar_upload_intents (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  object_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp')),
  expected_size_bytes INTEGER NOT NULL CHECK (expected_size_bytes BETWEEN 1 AND 2097152),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (length(trim(object_key)) > 0),
  CHECK (object_key NOT LIKE '/%')
);
CREATE INDEX IF NOT EXISTS avatar_upload_intents_user_expiry_idx
  ON avatar_upload_intents(user_id, expires_at);

-- Email changes are pending until a single-use verification token is consumed.
CREATE TABLE IF NOT EXISTS email_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  new_email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (length(trim(new_email)) BETWEEN 3 AND 254),
  CHECK (length(token_hash) = 64)
);
CREATE INDEX IF NOT EXISTS email_change_requests_user_idx
  ON email_change_requests(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS email_change_requests_pending_email_uq
  ON email_change_requests(lower(new_email)) WHERE used_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS email_change_requests_one_pending_per_user_uq
  ON email_change_requests(user_id) WHERE used_at IS NULL;

COMMIT;
