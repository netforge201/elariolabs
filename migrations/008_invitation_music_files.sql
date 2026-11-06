-- Couples' own background music for invitations. Additive only: no existing
-- table or column is changed. Files belong to the account (so a track can be
-- uploaded before the invitation is first saved) and are removed with it.
CREATE TABLE IF NOT EXISTS invitation_music_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES invitation_accounts(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL CHECK (size > 0),
  data BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS invitation_music_files_account_id_idx
  ON invitation_music_files(account_id);
