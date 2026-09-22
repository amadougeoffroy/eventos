import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/service';
import { getAuthUser } from '@/lib/supabase/auth-server';

// POST /api/account/delete
// Permanently deletes the authenticated user's account. `profiles.id` has
// `ON DELETE CASCADE` to `auth.users`, and every owned row (events, guests,
// tables, gifts, ...) cascades from there — so this one delete removes
// everything the user owns.
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const serviceClient = getServiceClient();
    const { error } = await serviceClient.auth.admin.deleteUser(user.id);

    if (error) {
      console.error('Error deleting account:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error in POST /api/account/delete:', err);
    return NextResponse.json({ error: err?.message || 'Erreur serveur' }, { status: 500 });
  }
}
