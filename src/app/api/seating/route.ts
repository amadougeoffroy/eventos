import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getServiceClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase service configuration missing');
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const eventId = searchParams.get('eventId');
    const token = searchParams.get('token');
    const guestId = searchParams.get('guestId');

    if (!slug && !eventId) {
      return NextResponse.json({ error: 'slug or eventId is required' }, { status: 400 });
    }

    const supabase = getServiceClient();

    // 1. Resolve event
    let eventQuery = supabase.from('events').select('id, name, slug, type, date, meta');
    if (eventId) {
      eventQuery = eventQuery.eq('id', eventId);
    } else if (slug) {
      eventQuery = eventQuery.eq('slug', slug);
    }
    const { data: event, error: eventErr } = await eventQuery.single();

    if (eventErr || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // 2. Fetch tables for this event
    const { data: tableRows, error: tableErr } = await supabase
      .from('event_tables')
      .select('*')
      .eq('event_id', event.id)
      .order('created_at', { ascending: true });

    if (tableErr) {
      console.error('Error fetching tables:', tableErr);
    }

    // 3. Fetch guest groups for this event
    const { data: groupRows } = await supabase
      .from('guest_groups')
      .select('*')
      .eq('event_id', event.id);

    // 4. Fetch confirmed/assigned guests for this event
    const { data: guestRows } = await supabase
      .from('guests')
      .select('id, first_name, last_name, token, group, table_id, rsvp_status, companions')
      .eq('event_id', event.id);

    // 5. Map tables
    const tables = (tableRows || []).map((t: any) => ({
      id: t.id,
      eventId: t.event_id,
      name: t.name || 'Table',
      capacity: t.capacity || 8,
      shape: t.shape === 'rectangular' ? 'rectangle' : (t.shape || 'round'),
      positionX: t.position_x || 0,
      positionY: t.position_y || 0,
      guestIds: Array.isArray(t.guest_ids) ? t.guest_ids : [],
    }));

    // 6. Map groups
    const groups = (groupRows || []).map((g: any) => ({
      id: g.id,
      name: g.name,
      emoji: g.emoji || '👥',
      color: g.color || '#C8A96E',
    }));

    // 7. Map guests for seating (only necessary info)
    const guests = (guestRows || []).map((g: any) => ({
      id: g.id,
      firstName: g.first_name || '',
      lastName: g.last_name || '',
      group: g.group || '',
      tableId: g.table_id || undefined,
      companions: g.companions || 0,
    }));

    // Reconcile: ensure guests have tableId if they are in table.guestIds, and vice versa
    tables.forEach((t) => {
      t.guestIds.forEach((gid: string) => {
        const pureGid = gid.includes('-comp-') ? gid.split('-comp-')[0] : gid;
        const g = guests.find((x) => x.id === pureGid);
        if (g && !g.tableId) {
          g.tableId = t.id;
        }
      });
    });

    guests.forEach((g) => {
      if (g.tableId) {
        const t = tables.find((x) => x.id === g.tableId);
        if (t && !t.guestIds.includes(g.id)) {
          t.guestIds.push(g.id);
        }
      }
    });

    // 8. Find target guest if token or guestId provided
    let currentGuest: any = null;
    let currentTable: any = null;

    if (token || guestId) {
      const match = (guestRows || []).find((g: any) =>
        (token && g.token === token) || (guestId && g.id === guestId)
      );

      if (match) {
        const foundSeatedGuest = guests.find((g) => g.id === match.id);
        const assignedTableId = foundSeatedGuest?.tableId || match.table_id ||
          tables.find((t) => t.guestIds.some((gid: string) => gid === match.id || gid.startsWith(`${match.id}-comp-`)))?.id;

        const tableObj = tables.find((t) => t.id === assignedTableId);
        const groupObj = groups.find((grp) => grp.name === match.group);

        currentGuest = {
          id: match.id,
          firstName: match.first_name || '',
          lastName: match.last_name || '',
          group: match.group || 'Invités',
          groupEmoji: groupObj?.emoji || '👥',
          groupColor: groupObj?.color || '#C8A96E',
          companions: match.companions || 0,
          tableId: assignedTableId || null,
          tableName: tableObj?.name || null,
        };

        if (tableObj) {
          currentTable = tableObj;
        }
      }
    }

    return NextResponse.json({
      event: {
        id: event.id,
        name: event.name,
        slug: event.slug,
        type: event.type,
        date: event.date,
        floorPlanElements: (event.meta as any)?.floorPlanElements || [],
      },
      tables,
      guests,
      groups,
      currentGuest,
      currentTable,
    });
  } catch (error: any) {
    console.error('Error in /api/seating:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
