-- Guest profile for personal invitations. Additive only; existing guests keep
-- exactly what they show today (no invite name → the list name is used, no
-- gender → neutral greeting, not "with family"). Safe to run more than once.
ALTER TABLE invitation_guests ADD COLUMN IF NOT EXISTS invite_name text;
ALTER TABLE invitation_guests ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE invitation_guests ADD COLUMN IF NOT EXISTS with_family boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invitation_guests_gender_check') THEN
    ALTER TABLE invitation_guests
      ADD CONSTRAINT invitation_guests_gender_check
      CHECK (gender IS NULL OR gender IN ('male', 'female'));
  END IF;
END $$;
