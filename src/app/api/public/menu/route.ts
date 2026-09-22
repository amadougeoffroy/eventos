import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/service';

// GET /api/public/menu?slug=...
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

    const { data: cats } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('event_id', evtRow.id)
      .order('sort_order', { ascending: true });

    const { data: items } = await supabase
      .from('menu_items')
      .select('*')
      .eq('event_id', evtRow.id)
      .order('created_at', { ascending: true });

    return NextResponse.json({
      categories: (cats || []).map((r: any) => ({
        id: r.id, eventId: r.event_id, name: r.name || '',
        icon: r.icon || '🍽️', order: r.sort_order ?? 0,
      })),
      items: (items || []).map((r: any) => ({
        id: r.id, eventId: r.event_id, categoryId: r.category_id,
        name: r.name || '', description: r.description || '',
        tags: r.tags || [], status: r.status === 'inactive' ? 'draft' : 'active',
        votes: r.votes ?? 0,
      })),
    });
  } catch (error: any) {
    console.error('Error in GET /api/public/menu:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}

// POST /api/public/menu — { slug, itemIds: string[] }
// Increments the vote count for each selected menu item.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, itemIds } = body;

    if (!slug || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json({ error: 'slug and itemIds are required' }, { status: 400 });
    }

    const supabase = getServiceClient();

    const { data: evtRow } = await supabase.from('events').select('id').eq('slug', slug).single();
    if (!evtRow) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Only vote for items that actually belong to this event.
    const { data: validItems } = await supabase
      .from('menu_items')
      .select('id, votes')
      .eq('event_id', evtRow.id)
      .in('id', itemIds);

    for (const item of validItems || []) {
      const { error } = await supabase.rpc('increment_menu_vote', { item_id: item.id });
      if (error) {
        await supabase.from('menu_items').update({ votes: (item.votes || 0) + 1 }).eq('id', item.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in POST /api/public/menu:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
