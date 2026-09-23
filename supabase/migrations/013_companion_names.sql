-- ═══════════════════════════════════════════════════════════
-- 013 — Store companion names captured on the RSVP form
--
-- The public RSVP form already asks for each companion's name and
-- relation, but that data was only kept in the browser's local state
-- and discarded before ever reaching the server — only the total
-- companion COUNT was persisted. This adds a column to actually store
-- it, as a JSON array of { name, relation }, indexed the same way the
-- dashboard already derives synthetic companion rows from the count.
-- ═══════════════════════════════════════════════════════════

ALTER TABLE guests ADD COLUMN IF NOT EXISTS companion_names JSONB DEFAULT '[]'::jsonb;
