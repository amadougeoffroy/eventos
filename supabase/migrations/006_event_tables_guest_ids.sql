-- Add guest_ids column to event_tables for storing assigned guests
ALTER TABLE event_tables ADD COLUMN IF NOT EXISTS guest_ids TEXT[] DEFAULT '{}';

-- Allow anon access for public RSVP flows
GRANT ALL ON event_tables TO anon, authenticated;
