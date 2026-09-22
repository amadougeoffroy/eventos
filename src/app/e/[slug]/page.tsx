'use client';
import { useApp } from '@/context/AppContext';
import { Event, Venue, Guest, GiftItem } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { use, useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { eventTypeConfig } from '@/lib/mock-data';
import { Sparkles } from 'lucide-react';
import { getTemplate, getDefaultTemplate, getTemplateVariant } from '@/lib/templates/template-registry';

// Invitation section components
import HeroSlideshow from '@/components/invitation/HeroSlideshow';
import IntroSplashScreen from '@/components/invitation/IntroSplashScreen';
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
import TableAssignmentModal from '@/components/invitation/TableAssignmentModal';
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
      try {
        const res = await fetch(`/api/public/event?slug=${encodeURIComponent(slug)}`);
        if (res.ok) {
          const data = await res.json();
          setPublicEvent(data.event);
          setPublicVenues(data.venues || []);
          setPublicGroups(data.groups || []);
        }
      } catch (e) {
        console.error('Error fetching public event:', e);
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
      try {
        const res = await fetch(`/api/public/gifts?slug=${encodeURIComponent(slug)}`);
        if (res.ok) {
          const data = await res.json();
          setPublicGifts(data.gifts || []);
        }
      } catch (e) {
        console.error('Error fetching public gifts:', e);
      }
    };
    loadPublicGifts();
  }, [event?.id]);

  // Track page view
  useEffect(() => {
    if (!event?.id) return;
    const trackView = async () => {
      try {
        const key = `eventos_viewed_${event.id}`;
        if (sessionStorage.getItem(key)) return; // 1 view per session
        sessionStorage.setItem(key, 'true');
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        await supabase.rpc('increment_event_views', { evt_id: event.id });
      } catch {}
    };
    trackView();
  }, [event?.id]);

  // Load menu categories & items for survey
  useEffect(() => {
    if (!event || !event.meta?.menuSurveyEnabled) return;
    const loadMenu = async () => {
      try {
        const res = await fetch(`/api/public/menu?slug=${encodeURIComponent(slug)}`);
        if (res.ok) {
          const data = await res.json();
          setPublicMenuCategories(data.categories || []);
          setPublicMenuItems(data.items || []);
        }
      } catch (e) {
        console.error('Error fetching public menu:', e);
      }
    };
    loadMenu();
  }, [event?.id, event?.meta?.menuSurveyEnabled, slug]);

  const handleSurveySubmit = async (selectedItemIds: string[]) => {
    try {
      await fetch('/api/public/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, itemIds: selectedItemIds }),
      });
    } catch (e) {
      console.error('Error submitting menu survey:', e);
    }
    // Save voted state in localStorage
    if (event) {
      try { localStorage.setItem(`eventos_survey_${event.id}`, 'true'); } catch {}
    }
  };

  const handlePublicReserve = async (giftId: string, guestFullName: string) => {
    try {
      const res = await fetch('/api/public/gifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, giftId, guestFullName }),
      });
      if (res.ok) {
        const data = await res.json();
        setPublicGifts(prev => prev.map(g => g.id === giftId ? data.gift : g));
        if (typeof updateGift === 'function') updateGift(giftId, { reserved: true, reservedByName: data.gift.reservedByName });
      }
    } catch (e) {
      console.error('Error reserving gift:', e);
    }
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
      try {
        // 3. Fallback: restore from localStorage (guest who filled the form without personalized link)
        let storedGuestId: string | undefined;
        if (!urlToken && !urlGuestParam) {
          try {
            const saved = localStorage.getItem(storageKey);
            if (saved) storedGuestId = JSON.parse(saved)?.guestId;
          } catch {}
        }
        if (!urlToken && !urlGuestParam && !storedGuestId) return;

        const params = new URLSearchParams({ slug });
        if (urlToken) params.set('token', urlToken);
        if (urlGuestParam) params.set('name', urlGuestParam);
        if (storedGuestId) params.set('guestId', storedGuestId);

        const res = await fetch(`/api/public/guest?${params.toString()}`);
        if (!res.ok) return;
        const { guest } = await res.json();
        if (guest) {
          setKnownGuest(guest as Guest);
          // Persist to localStorage for future refreshes
          localStorage.setItem(storageKey, JSON.stringify({ guestId: guest.id }));
        }
      } catch (e) {
        console.error('Error fetching guest:', e);
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

  // ── Seating assignment for known guest ──
  const [seatingInfo, setSeatingInfo] = useState<{
    tableName: string;
    groupName?: string;
    groupEmoji?: string;
    groupColor?: string;
  } | null>(null);
  const [showTableModal, setShowTableModal] = useState(false);

  useEffect(() => {
    if (!event) return;

    const fetchSeating = async () => {
      try {
        const tokenQuery = urlToken || knownGuest?.token || '';
        const guestIdQuery = knownGuest?.id || '';
        if (!tokenQuery && !guestIdQuery && !urlGuestParam) return;

        const params = new URLSearchParams({ slug });
        if (tokenQuery) params.set('token', tokenQuery);
        if (guestIdQuery) params.set('guestId', guestIdQuery);
        if (urlGuestParam) params.set('guestName', urlGuestParam);

        const res = await fetch(`/api/seating?${params.toString()}`);
        if (!res.ok) return;
        const data = await res.json();

        const currentG = data.currentGuest;

        if (currentG?.tableName) {
          setSeatingInfo({
            tableName: currentG.tableName,
            groupName: currentG.group,
            groupEmoji: currentG.groupEmoji,
            groupColor: currentG.groupColor,
          });

          setShowTableModal(true);
        }
      } catch (e) {
        console.error('Error fetching seating:', e);
      }
    };

    fetchSeating();
  }, [event?.id, slug, urlToken, urlGuestParam, knownGuest?.id, knownGuest?.token]);

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
    hero: () => (
      <HeroSlideshow
        key="hero"
        event={event}
        heroSlides={heroSlides}
        heroVideo={event.heroType === 'video' ? (event.heroVideo || '/default_video.mp4') : undefined}
        cfg={cfg}
        ornaments={!!template.specialEffects.ornaments}
        filmGrain={!!template.specialEffects.filmGrain}
        parallax={!!template.animations.parallax}
      />
    ),
    welcome: () => <SectionWelcome key="welcome" event={event} />,
    program: () => <SectionProgram key="program" event={event} venues={allVenues} />,
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
        particleType={variant?.particles}
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
  const baseSections = event.sectionsOrder || template.sections;
  const sections = [...baseSections];
  const eventGifts = (allGifts && allGifts.length > 0 ? allGifts : publicGifts).filter(g => g.eventId === event.id);
  if (eventGifts.length > 0 && !sections.includes('giftList')) {
    const rsvpIdx = sections.indexOf('rsvp');
    if (rsvpIdx !== -1) {
      sections.splice(rsvpIdx + 1, 0, 'giftList');
    } else {
      const sweetIdx = sections.indexOf('sweetMessage');
      if (sweetIdx !== -1) {
        sections.splice(sweetIdx, 0, 'giftList');
      } else {
        sections.push('giftList');
      }
    }
  }


  // Intro splash screen
  if (showIntro && event) {
    return <IntroSplashScreen event={event} onEnter={handleEnter} accentColor={variant?.palette.accent} />;
  }

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      data-template={templateId}
      data-layout={template.layout}
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

      {/* Table Assignment Modal */}
      {seatingInfo && (
        <TableAssignmentModal
          isOpen={showTableModal && !showIntro}
          onClose={() => setShowTableModal(false)}
          guestName={knownGuest ? `${knownGuest.firstName} ${knownGuest.lastName}` : (urlGuestParam ? decodeURIComponent(urlGuestParam).replace(/-/g, ' ') : '')}
          groupName={seatingInfo.groupName}
          groupEmoji={seatingInfo.groupEmoji}
          groupColor={seatingInfo.groupColor}
          tableName={seatingInfo.tableName}
          companions={knownGuest?.companions || 0}
          planUrl={`/e/${slug}/plan-de-table${urlToken ? `?token=${urlToken}` : urlGuestParam ? `?guest=${urlGuestParam}` : ''}`}
        />
      )}

      {/* Floating Seating Pill */}
      {seatingInfo && !showIntro && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 right-6 z-40"
        >
          <button
            type="button"
            onClick={() => setShowTableModal(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 text-xs font-bold text-white border border-red-500/50 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
              boxShadow: '0 8px 25px rgba(220, 38, 38, 0.45)',
            }}
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <span>🍽️ {seatingInfo.tableName}</span>
            <span className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-semibold">Voir</span>
          </button>
        </motion.div>
      )}

      {/* Background music — Premium only */}
      {event.backgroundMusicUrl && (
        <BackgroundMusic url={event.backgroundMusicUrl} />
      )}
    </div>
  );
}
