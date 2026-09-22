import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/service';

function mapGuestRow(row: any) {
  return {
    id: row.id,
    eventId: row.event_id,
    firstName: row.first_name || '',
    lastName: row.last_name || '',
    phone: row.phone || '',
    group: row.group || 'Invités',
    rsvpStatus: row.rsvp_status || 'pending',
    token: row.token || '',
    companions: row.companions || 0,
    allergies: row.allergies || '',
    dietaryRestrictions: [] as string[],
    respondedAt: row.updated_at || undefined,
  };
}

// GET /api/public/guest?slug=...&token=...            (personalized link)
//                        &name=First-Last              (fallback: guest typed/URL name)
//                        &guestId=...                  (fallback: restored from localStorage)
// Public, unauthenticated. Tries token, then name, then guestId — but only ever returns
// the single matching guest for this event, never the guest list.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const token = searchParams.get('token');
    const name = searchParams.get('name');
    const guestId = searchParams.get('guestId');

    if (!slug) {
      return NextResponse.json({ error: 'slug is required' }, { status: 400 });
    }
    if (!token && !name && !guestId) {
      return NextResponse.json({ guest: null });
    }

    const supabase = getServiceClient();

    const { data: evtRow } = await supabase.from('events').select('id').eq('slug', slug).single();
    if (!evtRow) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    let row: any = null;

    if (token) {
      const { data } = await supabase
        .from('guests')
        .select('*')
        .eq('event_id', evtRow.id)
        .eq('token', token)
        .single();
      row = data;
    }

    if (!row && name) {
      const nameParts = decodeURIComponent(name).replace(/-/g, ' ');
      const [first, ...rest] = nameParts.split(' ');
      const { data } = await supabase
        .from('guests')
        .select('*')
        .eq('event_id', evtRow.id)
        .ilike('first_name', first)
        .ilike('last_name', rest.join(' ') || '')
        .single();
      row = data;
    }

    if (!row && guestId) {
      const { data } = await supabase
        .from('guests')
        .select('*')
        .eq('event_id', evtRow.id)
        .eq('id', guestId)
        .single();
      row = data;
    }

    return NextResponse.json({ guest: row ? mapGuestRow(row) : null });
  } catch (error: any) {
    console.error('Error in /api/public/guest:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
