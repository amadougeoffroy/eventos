'use client';
import { useApp } from '@/context/AppContext';
import { Event, Venue, Guest } from '@/lib/types';
import { motion } from 'framer-motion';
import { use, useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { eventTypeConfig } from '@/lib/mock-data';
import { Sparkles } from 'lucide-react';
import { getTemplate, getDefaultTemplate, getTemplateVariant } from '@/lib/templates/template-registry';
import '@/lib/templates/template-themes.css';

// Invitation section components
import HeroSlideshow from '@/components/invitation/HeroSlideshow';
import SectionWelcome from '@/components/invitation/SectionWelcome';
import SectionProgram from '@/components/invitation/SectionProgram';
import SectionDressCode from '@/components/invitation/SectionDressCode';
import SectionLocation from '@/components/invitation/SectionLocation';
import SectionRsvp from '@/components/invitation/SectionRsvp';
import SectionSweetMessage from '@/components/invitation/SectionSweetMessage';

export default function GuestLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const searchParams = useSearchParams();
  const { events, guests, guestGroups, venues, updateGuest, addGuest } = useApp();
  const contextEvent = events.find(e => e.slug === slug);

  // For public visitors (not logged in), fetch event directly from Supabase
  const [publicEvent, setPublicEvent] = useState<Event | null>(null);
  const [publicVenues, setPublicVenues] = useState<Venue[]>([]);
  const [publicGroups, setPublicGroups] = useState<{id: string; name: string; emoji: string; color: string}[]>([]);
  const [publicLoading, setPublicLoading] = useState(!contextEvent);

  useEffect(() => {
    if (contextEvent) { setPublicLoading(false); return; }

    const fetchPublicEvent = async () => {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const { data: evtRow } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slug)
        .single();

      if (evtRow) {
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

        if (venueRows) {
          setPublicVenues(venueRows.map((v: any) => ({
            id: v.id, eventId: v.event_id, name: v.name,
            address: v.address, lat: v.lat, lng: v.lng,
            emoji: v.emoji, type: v.type,
          })));
        }

        const { dbEventToApp } = await import('@/lib/supabase/mappers');
        setPublicEvent({ ...dbEventToApp(evtRow), program });

        const { data: groupRows } = await supabase
          .from('guest_groups')
          .select('*')
          .eq('event_id', evtRow.id)
          .order('created_at', { ascending: true });

        if (groupRows) {
          setPublicGroups(groupRows.map((g: any) => ({
            id: g.id, name: g.name, emoji: g.emoji || '👥', color: g.color || '#C8A96E',
          })));
        }
      }
      setPublicLoading(false);
    };
    fetchPublicEvent();
  }, [contextEvent, slug]);

  const event = contextEvent || publicEvent;
  const allVenues = contextEvent ? venues : publicVenues;
  const allGroups = contextEvent
    ? guestGroups.filter(g => g.eventId === event?.id)
    : publicGroups;

  // ── Personalized link: detect known guest from URL ──
  const urlGuestParam = searchParams.get('guest');
  const urlToken = searchParams.get('token');

  const knownGuest = useMemo(() => {
    if (!event || !urlToken) return null;
    const byToken = guests.find(g => g.eventId === event.id && g.token === urlToken);
    if (byToken) return byToken;
    if (urlGuestParam) {
      const nameParts = decodeURIComponent(urlGuestParam).replace(/-/g, ' ').toLowerCase();
      return guests.find(g =>
        g.eventId === event.id &&
        `${g.firstName} ${g.lastName}`.toLowerCase() === nameParts
      ) || null;
    }
    return null;
  }, [event, guests, urlToken, urlGuestParam]);

  // ── Template configuration ──
  const templateId = event?.templateId || 'classique';
  const template = getTemplate(templateId) || getDefaultTemplate(event?.type || 'custom');
  const variant = event ? getTemplateVariant(templateId, event.type) : undefined;

  // Compute itinerary from program items with venues
  const itineraryStops = useMemo(() => {
    if (!event) return [];
    return event.program
      .filter(p => p.venueId)
      .map(p => {
        const v = allVenues.find(x => x.id === p.venueId);
        if (!v) return null;
        return { ...p, venue: v };
      })
      .filter(Boolean) as Array<{ id: string; time: string; title: string; icon: string; venue: { name: string; address: string; lat?: number; lng?: number; emoji?: string } }>;
  }, [event, allVenues]);

  // Hero slides: use custom heroMedia, heroImages, or defaults from template variant
  const heroSlides = useMemo(() => {
    if (!event) return ['/hero-wedding.png'];
    // Custom media first
    if (event.heroMedia && event.heroMedia.length > 0) {
      return event.heroMedia.filter(m => m.type === 'image').map(m => m.url);
    }
    if (event.heroImages && event.heroImages.length > 0) return event.heroImages;
    // Fallback to template defaults
    if (variant?.defaultHeroImages && variant.defaultHeroImages.length > 0) {
      return variant.defaultHeroImages;
    }
    // Ultimate fallback
    const defaults = ['/hero-wedding.png', '/hero-wedding-2.png', '/hero-wedding-3.png'];
    return event.coverPhoto ? [event.coverPhoto, ...defaults.slice(1)] : defaults;
  }, [event, variant]);

  // ── Loading state ──
  if (publicLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles size={40} style={{ color: 'var(--gold)' }} />
        </motion.div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <Sparkles size={48} style={{ color: 'var(--gold)', margin: '0 auto 1rem' }} />
          <h1 className="font-display text-2xl font-bold mb-2">Événement introuvable</h1>
          <p style={{ color: 'var(--text-muted)' }}>Ce lien ne correspond à aucun événement.</p>
        </div>
      </div>
    );
  }

  const cfg = eventTypeConfig[event.type];

  // ── Section rendering based on template config ──
  const sectionRenderers: Record<string, () => React.ReactNode> = {
    hero: () => <HeroSlideshow key="hero" event={event} heroSlides={heroSlides} cfg={cfg} />,
    welcome: () => <SectionWelcome key="welcome" event={event} />,
    program: () => <SectionProgram key="program" event={event} venues={allVenues.filter(v => v.eventId === event.id)} />,
    dressCode: () => <SectionDressCode key="dressCode" event={event} />,
    location: () => <SectionLocation key="location" event={event} itineraryStops={itineraryStops} />,
    rsvp: () => (
      <SectionRsvp
        key="rsvp"
        event={event}
        knownGuest={knownGuest}
        groups={allGroups}
        updateGuest={updateGuest}
        addGuest={addGuest}
      />
    ),
    sweetMessage: () => (
      <SectionSweetMessage
        key="sweetMessage"
        event={event}
        guestName={knownGuest ? `${knownGuest.firstName} ${knownGuest.lastName}` : ''}
      />
    ),
    // Premium sections — will be implemented in Phase 4
    countdown: () => null,
    ourStory: () => null,
    gallery: () => null,
    giftList: () => null,
  };

  // Use template sections order, or event custom order, or fallback
  const sections = event.sectionsOrder || template.sections;

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      data-template={templateId}
      style={{
        background: 'var(--t-bg, var(--bg))',
        color: 'var(--t-text, var(--text))',
        // Apply variant palette as CSS custom properties
        ...(variant ? {
          '--tp': variant.palette.primary,
          '--ts': variant.palette.secondary,
          '--tbg': variant.palette.bg,
          '--tbgw': variant.palette.bgWarm,
          '--tt': variant.palette.text,
          '--ttm': variant.palette.textMuted,
          '--ta': variant.palette.accent,
        } as React.CSSProperties : {}),
      }}
    >
      {/* Render sections in template order */}
      {sections.map(sectionId => {
        const renderer = sectionRenderers[sectionId];
        return renderer ? renderer() : null;
      })}

      {/* Footer */}
      <footer className="py-8 px-6 text-center" style={{ borderTop: '1px solid var(--t-card-border, var(--border-light))' }}>
        <p className="text-sm" style={{ color: 'var(--t-text-muted, var(--text-muted))' }}>
          Propulsé par <span className="gradient-gold font-semibold">EventOS</span>
        </p>
      </footer>
    </div>
  );
}
