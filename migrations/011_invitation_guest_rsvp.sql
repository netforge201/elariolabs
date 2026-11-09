-- RSVP on personal (named) invitations. Additive only: new columns with safe
-- defaults (RSVP off for everyone, no answers). Safe to run more than once.
ALTER TABLE invitation_guests ADD COLUMN IF NOT EXISTS rsvp_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE invitation_guests ADD COLUMN IF NOT EXISTS rsvp_status text;
ALTER TABLE invitation_guests ADD COLUMN IF NOT EXISTS rsvp_guests integer;
ALTER TABLE invitation_guests ADD COLUMN IF NOT EXISTS rsvp_note text;
ALTER TABLE invitation_guests ADD COLUMN IF NOT EXISTS rsvp_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invitation_guests_rsvp_status_check') THEN
    ALTER TABLE invitation_guests
      ADD CONSTRAINT invitation_guests_rsvp_status_check
      CHECK (rsvp_status IS NULL OR rsvp_status IN ('yes', 'no'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invitation_guests_rsvp_guests_check') THEN
    ALTER TABLE invitation_guests
      ADD CONSTRAINT invitation_guests_rsvp_guests_check
      CHECK (rsvp_guests IS NULL OR rsvp_guests BETWEEN 1 AND 20);
  END IF;
END $$;
