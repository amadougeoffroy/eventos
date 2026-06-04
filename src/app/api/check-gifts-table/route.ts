import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    db: { schema: 'public' },
  });

  // Try to query the gifts table
  const { error: testError } = await supabase.from('gifts').select('id').limit(1);
  
  if (testError && testError.code === 'PGRST205') {
    // Table doesn't exist - return SQL to execute
    return NextResponse.json({
      exists: false,
      message: 'La table gifts n\'existe pas encore. Exécutez le SQL suivant dans le Supabase SQL Editor:',
      sql: `CREATE TABLE IF NOT EXISTS gifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price NUMERIC(10,2) DEFAULT NULL,
  url TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  reserved_by UUID DEFAULT NULL,
  reserved BOOLEAN DEFAULT FALSE,
  category TEXT DEFAULT 'Général',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gift_select" ON gifts FOR SELECT USING (true);
CREATE POLICY "gift_insert" ON gifts FOR INSERT WITH CHECK (event_id IN (SELECT id FROM events WHERE user_id = auth.uid()));
CREATE POLICY "gift_update" ON gifts FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "gift_delete" ON gifts FOR DELETE USING (event_id IN (SELECT id FROM events WHERE user_id = auth.uid()));`
    });
  }
  
  return NextResponse.json({ exists: true, message: 'La table gifts existe déjà.' });
}
