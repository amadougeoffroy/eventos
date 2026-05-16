-- ╔══════════════════════════════════════════════════════════════╗
-- ║          EventOS — Schéma Base de Données Supabase          ║
-- ║   Exécuter dans : Supabase Dashboard → SQL Editor → New     ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ─── Enable UUID extension ──────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── USERS (via Supabase Auth — table profiles) ─────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── EVENTS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL DEFAULT 'custom',
  name TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME DEFAULT '14:00',
  venue TEXT DEFAULT '',
  venue_address TEXT DEFAULT '',
  cover_photo TEXT DEFAULT '',
  theme TEXT DEFAULT 'custom',
  primary_color TEXT DEFAULT '#D4AF37',
  secondary_color TEXT DEFAULT '#F7C5CC',
  dress_code TEXT DEFAULT '',
  welcome_message TEXT DEFAULT '',
  allow_companions BOOLEAN DEFAULT FALSE,
  max_companions INTEGER DEFAULT 2,
  plan TEXT DEFAULT 'essentiel' CHECK (plan IN ('essentiel', 'pro', 'premium')),
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PROGRAM ITEMS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS program_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  time TIME NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT '🎉',
  venue_id UUID DEFAULT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── GUEST GROUPS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS guest_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '👥',
  color TEXT DEFAULT '#C8A96E',
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── GUESTS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS guests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  "group" TEXT DEFAULT '',
  rsvp_status TEXT DEFAULT 'pending' CHECK (rsvp_status IN ('pending', 'confirmed', 'declined', 'maybe')),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(12), 'hex'),
  companions INTEGER DEFAULT 0,
  table_id UUID DEFAULT NULL,
  allergies TEXT DEFAULT '',
  dietary_restrictions TEXT[] DEFAULT '{}',
  side TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TABLES (plan de salle) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS event_tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity INTEGER DEFAULT 8,
  shape TEXT DEFAULT 'round' CHECK (shape IN ('round', 'rectangular', 'square')),
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── VENUES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT DEFAULT '',
  type TEXT DEFAULT 'reception',
  capacity INTEGER DEFAULT 0,
  contact TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  map_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── MENU CATEGORIES ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS menu_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '🍽️',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── MENU ITEMS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  votes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ORDERS (Jour J) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  table_id UUID REFERENCES event_tables(id) ON DELETE SET NULL,
  items JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'served')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- INDEXES for performance
-- ═══════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_guests_event_id ON guests(event_id);
CREATE INDEX IF NOT EXISTS idx_guests_token ON guests(token);
CREATE INDEX IF NOT EXISTS idx_guests_rsvp ON guests(event_id, rsvp_status);
CREATE INDEX IF NOT EXISTS idx_program_event ON program_items(event_id);
CREATE INDEX IF NOT EXISTS idx_tables_event ON event_tables(event_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_cat ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_event ON orders(event_id);

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- Chaque utilisateur ne voit que SES événements
-- ═══════════════════════════════════════════════════════════

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Profiles: un utilisateur voit/modifie son profil
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Events: un utilisateur voit/modifie ses événements
CREATE POLICY "Users can view own events" ON events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create events" ON events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own events" ON events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own events" ON events FOR DELETE USING (auth.uid() = user_id);

-- Tables liées aux événements: accès via l'event owner
CREATE POLICY "Access own event data" ON program_items FOR ALL
  USING (event_id IN (SELECT id FROM events WHERE user_id = auth.uid()));
CREATE POLICY "Access own guest_groups" ON guest_groups FOR ALL
  USING (event_id IN (SELECT id FROM events WHERE user_id = auth.uid()));
CREATE POLICY "Access own guests" ON guests FOR ALL
  USING (event_id IN (SELECT id FROM events WHERE user_id = auth.uid()));
CREATE POLICY "Access own tables" ON event_tables FOR ALL
  USING (event_id IN (SELECT id FROM events WHERE user_id = auth.uid()));
CREATE POLICY "Access own venues" ON venues FOR ALL
  USING (event_id IN (SELECT id FROM events WHERE user_id = auth.uid()));
CREATE POLICY "Access own menu_categories" ON menu_categories FOR ALL
  USING (event_id IN (SELECT id FROM events WHERE user_id = auth.uid()));
CREATE POLICY "Access own menu_items" ON menu_items FOR ALL
  USING (event_id IN (SELECT id FROM events WHERE user_id = auth.uid()));
CREATE POLICY "Access own orders" ON orders FOR ALL
  USING (event_id IN (SELECT id FROM events WHERE user_id = auth.uid()));

-- Guests: accès public en lecture pour les pages d'invitation (via token)
CREATE POLICY "Public can read guest by token" ON guests FOR SELECT
  USING (true); -- Le filtrage se fait via token côté API
CREATE POLICY "Public can update RSVP" ON guests FOR UPDATE
  USING (true); -- Contrôlé côté API

-- Events: accès public en lecture pour les pages d'invitation (via slug)
CREATE POLICY "Public can read event by slug" ON events FOR SELECT
  USING (true); -- Les pages /e/[slug] sont publiques

-- ═══════════════════════════════════════════════════════════
-- AUTO-CREATE PROFILE on signup
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: crée automatiquement un profil quand un user s'inscrit
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ═══════════════════════════════════════════════════════════
-- AUTO-UPDATE updated_at
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_events BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_guests BEFORE UPDATE ON guests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_orders BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
