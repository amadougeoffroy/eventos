import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/service';
import { dbEventToApp } from '@/lib/supabase/mappers';

// GET /api/public/event?slug=...
// Public, unauthenticated. Returns a single event (by slug) plus the data its
// invitation page needs — never the whole `events` table.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    if (!slug) {
      return NextResponse.json({ error: 'slug is required' }, { status: 400 });
    }

    const supabase = getServiceClient();

    const { data: evtRow, error: evtErr } = await supabase
      .from('events')
      .select('*')
      .eq('slug', slug)
      .single();

    if (evtErr || !evtRow) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const { data: programRows } = await supabase
      .from('program_items')
      .select('*')
      .eq('event_id', evtRow.id)
      .order('sort_order', { ascending: true });

    const program = (programRows || []).map((row: any) => ({
      id: row.id,
      time: row.time || '',
      title: row.title || '',
      description: row.description || '',
      icon: row.icon || '🎉',
      venueId: row.venue_id || undefined,
    }));

    const { data: venueRows } = await supabase
      .from('venues')
      .select('*')
      .eq('event_id', evtRow.id);

    const mappedVenues = (venueRows || []).map((v: any) => ({
      id: v.id, eventId: v.event_id, name: v.name,
      address: v.address, lat: v.lat, lng: v.lng,
      emoji: v.emoji, type: v.type,
    }));

    const missingVenueIds = program
      .map((p: any) => p.venueId)
      .filter((vId: any): vId is string => Boolean(vId) && !mappedVenues.some((mv: any) => mv.id === vId));

    if (missingVenueIds.length > 0) {
      const { data: extraVenues } = await supabase
        .from('venues')
        .select('*')
        .in('id', missingVenueIds);

      if (extraVenues) {
        extraVenues.forEach((v: any) => {
          mappedVenues.push({
            id: v.id, eventId: v.event_id, name: v.name,
            address: v.address, lat: v.lat, lng: v.lng,
            emoji: v.emoji, type: v.type,
          });
        });
      }
    }

    const event = { ...dbEventToApp(evtRow), program };

    const { data: groupRows } = await supabase
      .from('guest_groups')
      .select('*')
      .eq('event_id', evtRow.id)
      .order('created_at', { ascending: true });

    const groups = (groupRows || []).map((g: any) => ({
      id: g.id, name: g.name, emoji: g.emoji || '👥', color: g.color || '#C8A96E',
    }));

    return NextResponse.json({ event, venues: mappedVenues, groups });
  } catch (error: any) {
    console.error('Error in /api/public/event:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
