-- ╔══════════════════════════════════════════════════════════════╗
-- ║   EventOS — Accorder les permissions API aux tables          ║
-- ║   Exécuter dans : Supabase Dashboard → SQL Editor → New      ║
-- ╚══════════════════════════════════════════════════════════════╝

-- Accorder l'accès aux rôles API (anon = public, authenticated = logged in)
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT ALL ON profiles TO anon, authenticated;
GRANT ALL ON events TO anon, authenticated;
GRANT ALL ON program_items TO anon, authenticated;
GRANT ALL ON guest_groups TO anon, authenticated;
GRANT ALL ON guests TO anon, authenticated;
GRANT ALL ON event_tables TO anon, authenticated;
GRANT ALL ON venues TO anon, authenticated;
GRANT ALL ON menu_categories TO anon, authenticated;
GRANT ALL ON menu_items TO anon, authenticated;
GRANT ALL ON orders TO anon, authenticated;

-- Accorder l'accès aux séquences (pour les auto-increment)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
