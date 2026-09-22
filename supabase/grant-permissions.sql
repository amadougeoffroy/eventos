-- ╔══════════════════════════════════════════════════════════════╗
-- ║   EventOS — Accorder les permissions API aux tables          ║
-- ║   Exécuter dans : Supabase Dashboard → SQL Editor → New      ║
-- ╚══════════════════════════════════════════════════════════════╝

-- Accorder l'accès aux rôles API (anon = public, authenticated = logged in)
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- `anon` (public, unauthenticated) only needs table grants where a public
-- RLS policy actually exists. `events`/`guests`/`menu_categories`/`menu_items`
-- (and `gifts`, created in a later migration) have no public policy anymore:
-- their public access goes through server-side /api/public/* routes using
-- the service-role key instead. See migrations/011_secure_public_access.sql.
GRANT ALL ON profiles TO anon, authenticated;
GRANT ALL ON events TO authenticated;
GRANT ALL ON program_items TO anon, authenticated;
GRANT ALL ON guest_groups TO anon, authenticated;
GRANT ALL ON guests TO authenticated;
GRANT ALL ON event_tables TO anon, authenticated;
GRANT ALL ON venues TO anon, authenticated;
GRANT ALL ON menu_categories TO authenticated;
GRANT ALL ON menu_items TO authenticated;
GRANT ALL ON orders TO anon, authenticated;

-- Accorder l'accès aux séquences (pour les auto-increment)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
