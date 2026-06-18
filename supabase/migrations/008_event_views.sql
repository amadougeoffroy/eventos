-- Add view counter to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- Atomic increment function (no auth required for public pages)
CREATE OR REPLACE FUNCTION increment_event_views(evt_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE events
  SET views = COALESCE(views, 0) + 1
  WHERE id = evt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
