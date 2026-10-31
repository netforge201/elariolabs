ALTER TABLE analytics_events
  ADD COLUMN IF NOT EXISTS visitor_id text,
  ADD COLUMN IF NOT EXISTS session_id text,
  ADD COLUMN IF NOT EXISTS referrer text,
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS medium text,
  ADD COLUMN IF NOT EXISTS campaign text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS device text,
  ADD COLUMN IF NOT EXISTS browser text,
  ADD COLUMN IF NOT EXISTS os text;

CREATE INDEX IF NOT EXISTS analytics_events_visitor_created_idx
  ON analytics_events(visitor_id, created_at);

CREATE INDEX IF NOT EXISTS analytics_events_session_created_idx
  ON analytics_events(session_id, created_at);

CREATE INDEX IF NOT EXISTS analytics_events_source_created_idx
  ON analytics_events(source, created_at);

CREATE INDEX IF NOT EXISTS analytics_events_country_created_idx
  ON analytics_events(country, created_at);

CREATE INDEX IF NOT EXISTS analytics_events_path_created_idx
  ON analytics_events(path, created_at);
