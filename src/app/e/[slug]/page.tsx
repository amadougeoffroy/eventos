'use client';
import { useApp } from '@/context/AppContext';
import { Event, Venue, Guest, GiftItem } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { use, useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { eventTypeConfig } from '@/lib/mock-data';
import { Sparkles, ChevronDown } from 'lucide-react';
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
// Premium sections
import SectionOurStory from '@/components/invitation/SectionOurStory';
import SectionGallery from '@/components/invitation/SectionGallery';
import SectionGiftList from '@/components/invitation/SectionGiftList';
import BackgroundMusic, { startBackgroundMusic } from '@/components/invitation/BackgroundMusic';
import MenuSurveyModal from '@/components/invitation/MenuSurveyModal';
import { MenuCategory, MenuItem } from '@/lib/types';

export default function GuestLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const searchParams = useSearchParams();
  const { events, guests, guestGroups, venues, gifts: allGifts, updateGuest, addGuest, updateGift } = useApp();
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

  // ── Load gifts for public view ──
  const [publicGifts, setPublicGifts] = useState<GiftItem[]>([]);
  const [publicMenuCategories, setPublicMenuCategories] = useState<MenuCategory[]>([]);
  const [publicMenuItems, setPublicMenuItems] = useState<MenuItem[]>([]);
  const [showMenuSurvey, setShowMenuSurvey] = useState(false);
  useEffect(() => {
    if (!event) return;
    const loadPublicGifts = async () => {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data } = await supabase
        .from('gifts')
        .select('*')
        .eq('event_id', event.id)
        .order('created_at', { ascending: true });
      if (data) {
        setPublicGifts(data.map((row: any) => ({
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
        })));
      }
    };
    loadPublicGifts();
  }, [event?.id]);

  // Load menu categories & items for survey
  useEffect(() => {
    if (!event || !event.meta?.menuSurveyEnabled) return;
    const loadMenu = async () => {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: cats } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('event_id', event.id)
        .order('sort_order', { ascending: true });
      if (cats) {
        setPublicMenuCategories(cats.map((r: any) => ({
          id: r.id, eventId: r.event_id, name: r.name || '',
          icon: r.icon || '🍽️', order: r.sort_order ?? 0,
        })));
      }
      const { data: items } = await supabase
        .from('menu_items')
        .select('*')
        .eq('event_id', event.id)
        .order('created_at', { ascending: true });
      if (items) {
        setPublicMenuItems(items.map((r: any) => ({
          id: r.id, eventId: r.event_id, categoryId: r.category_id,
          name: r.name || '', description: r.description || '',
          tags: r.tags || [], status: r.status === 'inactive' ? 'draft' as const : 'active' as const,
          votes: r.votes ?? 0,
        })));
      }
    };
    loadMenu();
  }, [event?.id, event?.meta?.menuSurveyEnabled]);

  const handleSurveySubmit = async (selectedItemIds: string[]) => {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    // Increment votes for each selected item
    for (const itemId of selectedItemIds) {
      try {
        const { error } = await supabase.rpc('increment_menu_vote', { item_id: itemId });
        if (error) {
          // Fallback: manual increment
          const item = publicMenuItems.find(i => i.id === itemId);
          if (item) {
            await supabase.from('menu_items').update({ votes: (item.votes || 0) + 1 }).eq('id', itemId);
          }
        }
      } catch {
        const item = publicMenuItems.find(i => i.id === itemId);
        if (item) {
          await supabase.from('menu_items').update({ votes: (item.votes || 0) + 1 }).eq('id', itemId);
        }
      }
    }
    // Save voted state in localStorage
    if (event) {
      try { localStorage.setItem(`eventos_survey_${event.id}`, 'true'); } catch {}
    }
  };

  const handlePublicReserve = async (giftId: string, guestFullName: string) => {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    // Append name to existing names (multiple guests can offer the same gift)
    const existing = publicGifts.find(g => g.id === giftId);
    const currentNames = existing?.reservedByName || '';
    const namesList = currentNames ? currentNames.split(', ').filter(Boolean) : [];
    if (!namesList.includes(guestFullName)) namesList.push(guestFullName);
    const newNames = namesList.join(', ');
    await supabase.from('gifts').update({ reserved: true, reserved_by_name: newNames }).eq('id', giftId);
    setPublicGifts(prev => prev.map(g => g.id === giftId ? { ...g, reserved: true, reservedByName: newNames } : g));
    if (typeof updateGift === 'function') updateGift(giftId, { reserved: true, reservedByName: newNames });
  };

  // ── Personalized link: detect known guest from URL ──
  const urlGuestParam = searchParams.get('guest');
  const urlToken = searchParams.get('token');
  const [knownGuest, setKnownGuest] = useState<Guest | null>(null);

  // Always fetch guest from Supabase when token is present, or restore from localStorage
  useEffect(() => {
    if (!event) return;

    const storageKey = `eventos_rsvp_${event.id}`;

    const fetchGuest = async () => {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      let row: any = null;

      // 1. Try by URL token
      if (urlToken) {
        const { data } = await supabase
          .from('guests')
          .select('*')
          .eq('event_id', event.id)
          .eq('token', urlToken)
          .single();
        row = data;
      }

      // 2. Fallback: match by URL name
      if (!row && urlGuestParam) {
        const nameParts = decodeURIComponent(urlGuestParam).replace(/-/g, ' ');
        const [first, ...rest] = nameParts.split(' ');
        const { data: nameRow } = await supabase
          .from('guests')
          .select('*')
          .eq('event_id', event.id)
          .ilike('first_name', first)
          .ilike('last_name', rest.join(' ') || '')
          .single();
        row = nameRow;
      }

      // 3. Fallback: restore from localStorage (guest who filled the form without personalized link)
      if (!row && !urlToken && !urlGuestParam) {
        try {
          const saved = localStorage.getItem(storageKey);
          if (saved) {
            const { guestId } = JSON.parse(saved);
            if (guestId) {
              const { data } = await supabase
                .from('guests')
                .select('*')
                .eq('id', guestId)
                .single();
              row = data;
            }
          }
        } catch {}
      }

      if (row) {
        const guest: Guest = {
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
          dietaryRestrictions: [],
          respondedAt: row.updated_at || undefined,
        };
        setKnownGuest(guest);
        // Persist to localStorage for future refreshes
        localStorage.setItem(storageKey, JSON.stringify({ guestId: row.id }));
      }
    };
    fetchGuest();
  }, [event?.id, urlToken, urlGuestParam]);

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

  // ── Intro splash state (must be before early returns) ──
  const [showIntro, setShowIntro] = useState(true);

  const handleEnter = useCallback(() => {
    if (event?.backgroundMusicUrl) {
      startBackgroundMusic(event.backgroundMusicUrl);
    }
    setShowIntro(false);
  }, [event]);

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
    hero: () => <HeroSlideshow key="hero" event={event} heroSlides={heroSlides} heroVideo={event.heroType === 'video' ? (event.heroVideo || '/default_video.mp4') : undefined} cfg={cfg} />,
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
        menuSurveyEnabled={!!event.meta?.menuSurveyEnabled && publicMenuCategories.length > 0}
        onOpenSurvey={() => setShowMenuSurvey(true)}
        onRsvpComplete={(guest) => {
          setKnownGuest(guest);
          try { localStorage.setItem(`eventos_rsvp_${event.id}`, JSON.stringify({ guestId: guest.id })); } catch {}
        }}
      />
    ),
    sweetMessage: () => (
      <SectionSweetMessage
        key="sweetMessage"
        event={event}
        guestName={knownGuest ? `${knownGuest.firstName} ${knownGuest.lastName}` : ''}
      />
    ),
    // Premium sections
    countdown: () => null, // integrated in HeroSlideshow
    ourStory: () => <SectionOurStory key="ourStory" event={event} />,
    gallery: () => <SectionGallery key="gallery" event={event} />,
    giftList: () => {
      const eventGifts = (allGifts && allGifts.length > 0 ? allGifts : publicGifts).filter(g => g.eventId === event.id);
      if (eventGifts.length === 0) return null;
      const guestFullName = knownGuest ? `${knownGuest.firstName} ${knownGuest.lastName}`.trim() : '';
      const hasRsvpd = !!(knownGuest && knownGuest.rsvpStatus && knownGuest.rsvpStatus !== 'pending');
      return <SectionGiftList key="giftList" event={event} gifts={eventGifts} guestName={guestFullName} hasRsvpd={hasRsvpd} onReserve={handlePublicReserve} />;
    },
  };

  // Use template sections order, or event custom order, or fallback
  const sections = event.sectionsOrder || template.sections;


  // Intro splash screen
  if (showIntro && event) {
    const introCfg = eventTypeConfig[event.type];
    return (
      <motion.div
        onClick={handleEnter}
        style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          background: 'linear-gradient(180deg, #1a1614 0%, #2a2420 50%, #1a1614 100%)',
          padding: '2rem', textAlign: 'center', position: 'relative', overflow: 'hidden',
        }}
      >
        {/* Decorative rings */}
        {[200, 320, 440].map((size, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.06, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.2, duration: 1.2 }}
            style={{
              position: 'absolute', width: size, height: size, borderRadius: '50%',
              border: '1px solid #D4AF37',
            }}
          />
        ))}

        {/* Emoji */}
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 12, stiffness: 150, delay: 0.2 }}
          style={{ fontSize: '3rem', marginBottom: '1.5rem' }}
        >
          {introCfg.emoji}
        </motion.div>

        {/* Event name */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="font-display"
          style={{
            fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: 800,
            background: 'linear-gradient(135deg, #D4AF37, #F0D878, #D4AF37)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem', lineHeight: 1.2,
          }}
        >
          {event.name}
        </motion.h1>

        {/* Date */}
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', fontWeight: 500, marginBottom: '2.5rem' }}
        >
          {new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
          }}
        >
          <span style={{
            padding: '0.65rem 2rem', borderRadius: 50,
            background: 'linear-gradient(135deg, #D4AF37, #C8A96E)',
            color: '#1a1614', fontWeight: 700, fontSize: '0.85rem',
            letterSpacing: '0.05em',
          }}>
            Ouvrir l&apos;invitation
          </span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ChevronDown size={20} style={{ color: 'rgba(255,255,255,0.3)' }} />
          </motion.div>
        </motion.div>

        {event.backgroundMusicUrl && (
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
            style={{ position: 'absolute', bottom: 24, color: 'rgba(255,255,255,0.25)', fontSize: '0.65rem' }}
          >
            🎵 Avec musique d&apos;ambiance
          </motion.p>
        )}
      </motion.div>
    );
  }

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

      {/* Menu Survey Modal */}
      <AnimatePresence>
        {showMenuSurvey && event && (
          <MenuSurveyModal
            event={event}
            categories={publicMenuCategories}
            items={publicMenuItems}
            guestName={knownGuest ? `${knownGuest.firstName} ${knownGuest.lastName}` : ''}
            onClose={() => setShowMenuSurvey(false)}
            onSubmit={handleSurveySubmit}
          />
        )}
      </AnimatePresence>

      {/* Background music — Premium only */}
      {event.backgroundMusicUrl && (
        <BackgroundMusic url={event.backgroundMusicUrl} />
      )}
    </div>
  );
}
