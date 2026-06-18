-- Add source column to distinguish manually added guests from RSVP self-registrations
ALTER TABLE guests ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'rsvp'));
