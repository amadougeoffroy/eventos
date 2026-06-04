-- ============================================
-- Migration: Template System for Events
-- ============================================

-- 1. Add template columns to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS template_id TEXT DEFAULT 'classique';
ALTER TABLE events ADD COLUMN IF NOT EXISTS hero_type TEXT DEFAULT 'image' CHECK (hero_type IN ('image', 'slideshow', 'video'));
ALTER TABLE events ADD COLUMN IF NOT EXISTS hero_media JSONB DEFAULT '[]'::jsonb;
ALTER TABLE events ADD COLUMN IF NOT EXISTS background_music_url TEXT DEFAULT '';
ALTER TABLE events ADD COLUMN IF NOT EXISTS sections_order TEXT[] DEFAULT NULL;

-- 2. Create Supabase Storage bucket for event media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-media',
  'event-media',
  true,
  52428800,  -- 50MB max file size
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm',
    'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage policies — allow authenticated users to manage their event media
CREATE POLICY "Users can upload event media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'event-media');

CREATE POLICY "Users can update their event media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'event-media');

CREATE POLICY "Users can delete their event media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'event-media');

CREATE POLICY "Event media is publicly readable"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'event-media');

-- 4. Index for faster template lookups
CREATE INDEX IF NOT EXISTS idx_events_template_id ON events (template_id);

-- 5. Sweet messages table (if not exists)
CREATE TABLE IF NOT EXISTS sweet_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL DEFAULT 'Anonyme',
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sweet_messages_event ON sweet_messages (event_id);

-- Enable RLS on sweet_messages
ALTER TABLE sweet_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert sweet messages"
  ON sweet_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Event owners can read sweet messages"
  ON sweet_messages FOR SELECT
  TO authenticated
  USING (true);
