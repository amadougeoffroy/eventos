-- Gift prices were displaying '€' or 'FCFA' based on a `price >= 500` guess
-- (src/app/dashboard/events/[eventId]/gifts/page.tsx) instead of a real
-- currency. Add an explicit, event-level currency instead.
ALTER TABLE events ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'FCFA';
