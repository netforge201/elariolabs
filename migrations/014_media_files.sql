-- Site images stored in the database (replaces ImgBB, which blocks embedding).
CREATE TABLE IF NOT EXISTS media_files (
  key text PRIMARY KEY,
  mime_type text NOT NULL,
  data bytea NOT NULL,
  created_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
