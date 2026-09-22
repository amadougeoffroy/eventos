-- ═══════════════════════════════════════════════════════════
-- 011 — Close the public data leak
--
-- guests/gifts/events/menu_categories/menu_items had "USING (true)" RLS
-- policies with no row filter, combined with `GRANT ALL ... TO anon` in
-- grant-permissions.sql. Anyone holding the public anon key (shipped in the
-- client JS bundle) could read or write every organizer's guest list,
-- gift list, and event data — not just the one event they had a link to.
--
-- Public access to this data now goes exclusively through the
-- /api/public/* and /api/seating server routes, which use the service-role
-- key (bypasses RLS) and scope every query themselves. These policies and
-- grants are no longer needed and are removed.
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Public can read guest by token" ON guests;
DROP POLICY IF EXISTS "Public can update RSVP" ON guests;
DROP POLICY IF EXISTS "Public can read event by slug" ON events;
DROP POLICY IF EXISTS "Public can read gifts" ON gifts;
DROP POLICY IF EXISTS "Public can reserve gifts" ON gifts;
DROP POLICY IF EXISTS "Public can read menu_categories" ON menu_categories;
DROP POLICY IF EXISTS "Public can read menu_items" ON menu_items;

-- Authenticated (logged-in organizer) access is untouched — it continues to
-- work via the existing "Access own X" / "Users can view own events" etc.
-- policies, which are correctly scoped to auth.uid() and don't need anon.
REVOKE ALL ON guests FROM anon;
REVOKE ALL ON gifts FROM anon;
REVOKE ALL ON events FROM anon;
REVOKE ALL ON menu_categories FROM anon;
REVOKE ALL ON menu_items FROM anon;

-- increment_event_views / increment_menu_vote stay callable by anon: they are
-- SECURITY DEFINER functions that only ever perform one atomic, narrow
-- increment — not raw table access — so they were never part of the leak.
