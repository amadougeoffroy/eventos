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
    source: row.source || 'manual',
  };
}

// POST /api/public/rsvp
// Body (known guest, e.g. personalized link or restored from localStorage):
//   { slug, guestId, token?, rsvpChoice, companions, allergies }
// Body (new self-registering guest):
//   { slug, rsvpChoice, guestName, guestPhone?, guestGroup?, companions, allergies }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, rsvpChoice } = body;

    if (!slug || !rsvpChoice) {
      return NextResponse.json({ error: 'slug and rsvpChoice are required' }, { status: 400 });
    }
    if (!['confirmed', 'declined', 'maybe'].includes(rsvpChoice)) {
      return NextResponse.json({ error: 'Invalid rsvpChoice' }, { status: 400 });
    }

    const supabase = getServiceClient();

    const { data: evtRow } = await supabase.from('events').select('id').eq('slug', slug).single();
    if (!evtRow) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const companions = Number(body.companions) || 0;
    const allergies = body.allergies || null;

    // Known guest → update, but only if it truly belongs to this event, and only
    // if the caller can identify it by its id or token (both are opaque, unguessable values).
    if (body.guestId || body.token) {
      let query = supabase.from('guests').select('*').eq('event_id', evtRow.id);
      query = body.guestId ? query.eq('id', body.guestId) : query.eq('token', body.token);
      const { data: existing } = await query.single();

      if (!existing) {
        return NextResponse.json({ error: 'Guest not found' }, { status: 404 });
      }

      const { data: updated, error: updateErr } = await supabase
        .from('guests')
        .update({
          rsvp_status: rsvpChoice,
          companions,
          allergies,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateErr || !updated) {
        console.error('RSVP update error:', updateErr);
        return NextResponse.json({ error: 'Could not save RSVP' }, { status: 500 });
      }

      return NextResponse.json({ guest: mapGuestRow(updated) });
    }

    // New self-registering guest → insert.
    const guestName = (body.guestName || '').trim();
    if (!guestName) {
      return NextResponse.json({ error: 'guestName is required' }, { status: 400 });
    }
    const [first, ...rest] = guestName.split(' ');

    const { data: inserted, error: insertErr } = await supabase
      .from('guests')
      .insert({
        event_id: evtRow.id,
        first_name: first,
        last_name: rest.join(' ') || '',
        phone: body.guestPhone || null,
        group: body.guestGroup || 'Invités',
        rsvp_status: rsvpChoice,
        companions,
        allergies,
        source: 'rsvp',
      })
      .select()
      .single();

    if (insertErr || !inserted) {
      console.error('RSVP insert error:', insertErr);
      return NextResponse.json({ error: 'Could not save RSVP' }, { status: 500 });
    }

    return NextResponse.json({ guest: mapGuestRow(inserted) });
  } catch (error: any) {
    console.error('Error in /api/public/rsvp:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
