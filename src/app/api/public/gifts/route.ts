import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/service';

function mapGiftRow(row: any) {
  return {
    id: row.id,
    eventId: row.event_id,
    name: row.name || '',
    description: row.description || '',
    price: row.price ? Number(row.price) : undefined,
    url: row.url || '',
    imageUrl: row.image_url || '',
    reservedBy: row.reserved_by || undefined,
    reservedByName: row.reserved_by_name || undefined,
    reserved: row.reserved || false,
    category: row.category || 'Général',
  };
}

// GET /api/public/gifts?slug=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    if (!slug) {
      return NextResponse.json({ error: 'slug is required' }, { status: 400 });
    }

    const supabase = getServiceClient();

    const { data: evtRow } = await supabase.from('events').select('id').eq('slug', slug).single();
    if (!evtRow) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const { data } = await supabase
      .from('gifts')
      .select('*')
      .eq('event_id', evtRow.id)
      .order('created_at', { ascending: true });

    return NextResponse.json({ gifts: (data || []).map(mapGiftRow) });
  } catch (error: any) {
    console.error('Error in GET /api/public/gifts:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

// POST /api/public/gifts — { slug, giftId, guestFullName }
// Reserves a gift, appending the guest's name to the existing list of offerers
// (several guests can pitch in on the same gift).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, giftId, guestFullName } = body;

    if (!slug || !giftId || !guestFullName) {
      return NextResponse.json({ error: 'slug, giftId and guestFullName are required' }, { status: 400 });
    }

    const supabase = getServiceClient();

    const { data: evtRow } = await supabase.from('events').select('id').eq('slug', slug).single();
    if (!evtRow) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const { data: gift } = await supabase
      .from('gifts')
      .select('*')
      .eq('id', giftId)
      .eq('event_id', evtRow.id)
      .single();

    if (!gift) {
      return NextResponse.json({ error: 'Gift not found' }, { status: 404 });
    }

    const currentNames = gift.reserved_by_name || '';
    const namesList = currentNames ? currentNames.split(', ').filter(Boolean) : [];
    if (!namesList.includes(guestFullName)) namesList.push(guestFullName);
    const newNames = namesList.join(', ');

    const { data: updated, error: updateErr } = await supabase
      .from('gifts')
      .update({ reserved: true, reserved_by_name: newNames })
      .eq('id', giftId)
      .select()
      .single();

    if (updateErr || !updated) {
      console.error('Gift reserve error:', updateErr);
      return NextResponse.json({ error: 'Could not reserve gift' }, { status: 500 });
    }

    return NextResponse.json({ gift: mapGiftRow(updated) });
  } catch (error: any) {
    console.error('Error in POST /api/public/gifts:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
