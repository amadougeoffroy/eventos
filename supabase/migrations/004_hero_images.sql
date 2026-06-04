-- ============================================
-- Migration: Add hero_images column to events
-- ============================================

ALTER TABLE events ADD COLUMN IF NOT EXISTS hero_images TEXT[] DEFAULT NULL;
