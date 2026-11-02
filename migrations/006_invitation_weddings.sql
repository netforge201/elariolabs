-- Invitations: one wedding workspace per client account
CREATE TABLE IF NOT EXISTS invitation_weddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL UNIQUE REFERENCES invitation_accounts(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  partner_one TEXT NOT NULL DEFAULT '',
  partner_two TEXT NOT NULL DEFAULT '',
  event_date DATE,
  event_time TEXT,
  timezone TEXT NOT NULL DEFAULT 'Asia/Baku',
  venue_name TEXT,
  venue_address TEXT,
  welcome_text TEXT,
  story TEXT,
  locale TEXT NOT NULL DEFAULT 'az',
  template TEXT NOT NULL DEFAULT 'elegant',
  theme JSONB,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS invitation_weddings_is_published_idx
  ON invitation_weddings(is_published);
