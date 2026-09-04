import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

async function getAuthUser(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // 1. Check Bearer token in Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    const serviceClient = getServiceClient();
    const { data: { user }, error } = await serviceClient.auth.getUser(token);
    if (!error && user) return user;
  }

  // 2. Check cookies
  try {
    const cookieStore = await cookies();
    const serverClient = createServerClient(supabaseUrl, anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Can happen in Server Components
          }
        },
      },
    });
    const { data: { user } } = await serverClient.auth.getUser();
    return user || null;
  } catch (err) {
    console.error('Error reading cookies in /api/venues:', err);
    return null;
  }
}

// GET /api/venues?eventId=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ error: 'Missing eventId parameter' }, { status: 400 });
    }

    const serviceClient = getServiceClient();
    const { data, error } = await serviceClient
      .from('venues')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, venues: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

// POST /api/venues
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié. Veuillez vous reconnecter.' }, { status: 401 });
    }

    const body = await request.json();
    const { id, eventId, name, address, emoji, lat, lng, type, draftEvent } = body;

    if (!eventId || !name || !name.trim()) {
      return NextResponse.json({ error: 'Identifiant d\'événement et nom de lieu requis' }, { status: 400 });
    }

    const serviceClient = getServiceClient();

    // 1. Verify or ensure parent event exists
    const { data: existingEvent } = await serviceClient
      .from('events')
      .select('id, user_id')
      .eq('id', eventId)
      .single();

    if (!existingEvent) {
      // Event doesn't exist yet in DB. If draftEvent info is provided, create it
      const fallbackDate = draftEvent?.date || new Date().toISOString().split('T')[0];
      const fallbackName = draftEvent?.name || 'Nouvel Événement';
      const fallbackSlug = draftEvent?.slug || `event-${eventId.slice(0, 8)}-${Date.now().toString(36)}`;

      const { error: createEventErr } = await serviceClient.from('events').insert({
        id: eventId,
        user_id: user.id,
        name: fallbackName,
        slug: fallbackSlug,
        type: draftEvent?.type || 'wedding',
        date: fallbackDate,
        time: draftEvent?.time || '14:00',
        venue: name.trim(),
        venue_address: address || '',
        theme: draftEvent?.type || 'wedding',
        primary_color: draftEvent?.primaryColor || '#D4AF37',
        secondary_color: draftEvent?.secondaryColor || '#F7C5CC',
        plan: draftEvent?.plan || 'essentiel',
      });

      if (createEventErr) {
        console.error('Error auto-creating draft event:', createEventErr);
        return NextResponse.json({ error: `Impossible de préparer l'événement: ${createEventErr.message}` }, { status: 500 });
      }
    } else if (existingEvent.user_id !== user.id) {
      return NextResponse.json({ error: 'Vous n\'avez pas la permission de modifier cet événement.' }, { status: 403 });
    }

    // 2. Validate UUID for venue id
    const isUuid = id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const venueId = isUuid ? id : crypto.randomUUID();

    // 3. Upsert venue safely with service role
    const { data: savedVenue, error: venueErr } = await serviceClient
      .from('venues')
      .upsert({
        id: venueId,
        event_id: eventId,
        name: name.trim(),
        address: address || '',
        lat: lat || null,
        lng: lng || null,
        emoji: emoji || '📍',
        type: type || 'reception',
      })
      .select()
      .single();

    if (venueErr) {
      console.error('Error upserting venue via service role:', venueErr);
      return NextResponse.json({ error: venueErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      venue: {
        id: savedVenue.id,
        eventId: savedVenue.event_id,
        name: savedVenue.name,
        address: savedVenue.address || '',
        lat: savedVenue.lat,
        lng: savedVenue.lng,
        emoji: savedVenue.emoji || '📍',
        type: savedVenue.type || '',
      },
    });
  } catch (err: any) {
    console.error('Error in POST /api/venues:', err);
    return NextResponse.json({ error: err?.message || 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/venues?id=...
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('id');

    if (!venueId) {
      return NextResponse.json({ error: 'Missing venue id' }, { status: 400 });
    }

    const serviceClient = getServiceClient();

    // Verify ownership via event
    const { data: venue } = await serviceClient
      .from('venues')
      .select('id, event_id, events(user_id)')
      .eq('id', venueId)
      .single();

    if (!venue) {
      return NextResponse.json({ success: true });
    }

    const eventOwner = (venue as any).events?.user_id;
    if (eventOwner && eventOwner !== user.id) {
      return NextResponse.json({ error: 'Action non autorisée' }, { status: 403 });
    }

    const { error } = await serviceClient.from('venues').delete().eq('id', venueId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erreur serveur' }, { status: 500 });
  }
}
