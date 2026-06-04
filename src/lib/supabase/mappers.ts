/**
 * Helpers pour mapper entre les types Supabase (snake_case)
 * et les types TypeScript de l'app (camelCase)
 */
import { Event, ProgramItem } from '@/lib/types';

/** Map a Supabase row → App Event */
export function dbEventToApp(row: Record<string, unknown>): Event {
  return {
    id: row.id as string,
    slug: row.slug as string,
    type: (row.type as Event['type']) || 'custom',
    name: row.name as string,
    date: row.date as string,
    time: (row.time as string) || '14:00',
    venue: (row.venue as string) || '',
    venueAddress: (row.venue_address as string) || '',
    coverPhoto: (row.cover_photo as string) || '',
    theme: (row.theme as string) || 'custom',
    primaryColor: (row.primary_color as string) || '#D4AF37',
    secondaryColor: (row.secondary_color as string) || '#F7C5CC',
    dressCode: (row.dress_code as string) || '',
    welcomeMessage: (row.welcome_message as string) || '',
    allowCompanions: (row.allow_companions as boolean) || false,
    maxCompanions: (row.max_companions as number) || 2,
    program: [], // Loaded separately from program_items table
    meta: (row.meta as Event['meta']) || {},
    plan: (row.plan as Event['plan']) || 'essentiel',
    templateId: (row.template_id as string) || 'classique',
    heroType: (row.hero_type as Event['heroType']) || 'image',
    heroImages: (row.hero_images as string[]) || undefined,
    heroMedia: (row.hero_media as Event['heroMedia']) || [],
    backgroundMusicUrl: (row.background_music_url as string) || '',
    sectionsOrder: (row.sections_order as string[]) || undefined,
    createdAt: (row.created_at as string) || new Date().toISOString(),
  };
}

/** Map App Event → Supabase insert/update payload */
export function appEventToDb(event: Partial<Event> & { userId?: string }) {
  const payload: Record<string, unknown> = {};

  if (event.userId !== undefined) payload.user_id = event.userId;
  if (event.slug !== undefined) payload.slug = event.slug;
  if (event.type !== undefined) payload.type = event.type;
  if (event.name !== undefined) payload.name = event.name;
  if (event.date !== undefined) payload.date = event.date;
  if (event.time !== undefined) payload.time = event.time;
  if (event.venue !== undefined) payload.venue = event.venue;
  if (event.venueAddress !== undefined) payload.venue_address = event.venueAddress;
  if (event.coverPhoto !== undefined) payload.cover_photo = event.coverPhoto;
  if (event.theme !== undefined) payload.theme = event.theme;
  if (event.primaryColor !== undefined) payload.primary_color = event.primaryColor;
  if (event.secondaryColor !== undefined) payload.secondary_color = event.secondaryColor;
  if (event.dressCode !== undefined) payload.dress_code = event.dressCode;
  if (event.welcomeMessage !== undefined) payload.welcome_message = event.welcomeMessage;
  if (event.allowCompanions !== undefined) payload.allow_companions = event.allowCompanions;
  if (event.maxCompanions !== undefined) payload.max_companions = event.maxCompanions;
  if (event.meta !== undefined) payload.meta = event.meta;
  if (event.plan !== undefined) payload.plan = event.plan;
  if (event.templateId !== undefined) payload.template_id = event.templateId;
  if (event.heroType !== undefined) payload.hero_type = event.heroType;
  if (event.heroImages !== undefined) payload.hero_images = event.heroImages;
  if (event.heroMedia !== undefined) payload.hero_media = event.heroMedia;
  if (event.backgroundMusicUrl !== undefined) payload.background_music_url = event.backgroundMusicUrl;
  if (event.sectionsOrder !== undefined) payload.sections_order = event.sectionsOrder;

  return payload;
}
