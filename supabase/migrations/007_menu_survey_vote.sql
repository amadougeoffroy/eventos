-- Increment vote count on a menu item
CREATE OR REPLACE FUNCTION increment_menu_vote(item_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE menu_items
  SET votes = COALESCE(votes, 0) + 1
  WHERE id = item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
