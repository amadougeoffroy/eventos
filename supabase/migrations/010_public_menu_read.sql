-- Allow public (anonymous) read access to menu data for the survey on invitation pages
CREATE POLICY "Public can read menu_categories" ON menu_categories FOR SELECT
  USING (true);

CREATE POLICY "Public can read menu_items" ON menu_items FOR SELECT
  USING (true);

-- Allow public to increment votes via RPC (already SECURITY DEFINER)
-- Allow public to call increment_event_views (already SECURITY DEFINER)
