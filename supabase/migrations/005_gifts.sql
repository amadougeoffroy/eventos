-- ============================================
-- 005 — Gifts table
-- ============================================

CREATE TABLE IF NOT EXISTS gifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price NUMERIC(10,2) DEFAULT NULL,
  url TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  reserved_by UUID DEFAULT NULL REFERENCES guests(id) ON DELETE SET NULL,
  reserved BOOLEAN DEFAULT FALSE,
  category TEXT DEFAULT 'Général',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;

-- Owner can manage their event's gifts
CREATE POLICY "Owner can manage gifts" ON gifts
  FOR ALL
  USING (
    event_id IN (SELECT id FROM events WHERE user_id = auth.uid())
  );

-- Public can read gifts (for invitation page)
CREATE POLICY "Public can read gifts" ON gifts
  FOR SELECT
  USING (true);

-- Public can update reserved status
CREATE POLICY "Public can reserve gifts" ON gifts
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Add reserved_by_name column
ALTER TABLE gifts ADD COLUMN IF NOT EXISTS reserved_by_name TEXT DEFAULT NULL;
