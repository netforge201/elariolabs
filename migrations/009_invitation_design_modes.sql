-- Invitation design modes.
--
-- Two independent settings:
--   * invitation_weddings.design_mode  - 'global' (one design for everyone) or
--     'individual' (each guest uses their own design).
--     invitation_weddings.template keeps its meaning: the wedding's global
--     design. It is never copied into guests when the mode changes.
--   * invitation_guests.template       - the guest's own design, used only in
--     individual mode. Kept untouched while global mode is active.
--
-- Additive only: no table, column or row is dropped or deleted. Every
-- statement is idempotent, so re-running the file is harmless.

ALTER TABLE invitation_weddings
  ADD COLUMN IF NOT EXISTS design_mode TEXT NOT NULL DEFAULT 'global';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'invitation_weddings_design_mode_check'
  ) THEN
    ALTER TABLE invitation_weddings
      ADD CONSTRAINT invitation_weddings_design_mode_check
      CHECK (design_mode IN ('global', 'individual'));
  END IF;
END $$;

ALTER TABLE invitation_guests
  ADD COLUMN IF NOT EXISTS template TEXT;

-- Existing guests have never had a design of their own: they always showed
-- their wedding's design. Give each one exactly that design (with the same
-- legacy mapping the app uses: 'elegant' -> 'modern', unknown -> 'classic'),
-- so nothing changes visually and individual mode starts from a valid value.
-- Only rows that have no value yet are touched.
UPDATE invitation_guests AS g
SET template = CASE w.template
    WHEN 'modern' THEN 'modern'
    WHEN 'elegant' THEN 'modern'
    WHEN 'minimal' THEN 'minimal'
    ELSE 'classic'
  END
FROM invitation_weddings AS w
WHERE g.wedding_id = w.id
  AND g.template IS NULL;

ALTER TABLE invitation_guests ALTER COLUMN template SET DEFAULT 'classic';
ALTER TABLE invitation_guests ALTER COLUMN template SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'invitation_guests_template_check'
  ) THEN
    ALTER TABLE invitation_guests
      ADD CONSTRAINT invitation_guests_template_check
      CHECK (template IN ('classic', 'modern', 'minimal'));
  END IF;
END $$;
