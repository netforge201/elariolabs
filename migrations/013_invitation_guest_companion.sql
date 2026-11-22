-- Who the guest is invited with besides "family": 'wife' | 'spouse' | null.
-- Additive, safe to run more than once.
ALTER TABLE invitation_guests ADD COLUMN IF NOT EXISTS companion text;
