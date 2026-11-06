-- Six new invitation designs (Azerbaijani carpet & buta collection).
--
-- Migration 009 limited a guest's own design to the three original ids. This
-- widens that CHECK constraint to all nine designs so the new ones can be
-- assigned per guest. No row is read, changed or deleted: only the constraint
-- definition is replaced, and every existing value is already in the new list.
-- invitation_weddings.template has no constraint, so it needs no change.
-- Safe to re-run.

ALTER TABLE invitation_guests
  DROP CONSTRAINT IF EXISTS invitation_guests_template_check;

ALTER TABLE invitation_guests
  ADD CONSTRAINT invitation_guests_template_check
  CHECK (template IN (
    'classic', 'modern', 'minimal',
    'carpet', 'buta', 'palace', 'asymmetric', 'garden', 'heritage'
  ));
