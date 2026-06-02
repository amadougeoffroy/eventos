'use client';
import { useApp } from '@/context/AppContext';
import { Event, Venue } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { use, useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { eventTypeConfig } from '@/lib/mock-data';
import { MapPin, CalendarDays, Clock, Heart, ChevronDown, ChevronLeft, ChevronRight, Check, X, HelpCircle, Sparkles, Navigation, MessageCircleHeart, Send, Users } from 'lucide-react';

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <motion.div
        className="text-3xl md:text-5xl font-bold font-display"
        key={value}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{ color: '#FFFFFF' }}
      >
        {String(value).padStart(2, '0')}
      </motion.div>
      <div className="text-xs md:text-sm mt-1 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</div>
    </div>
  );
}

function Particles({ type }: { type: string }) {
  const particles = useMemo(() => Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: ((i * 37 + 13) % 100),
    y: ((i * 23 + 7) % 100),
    size: ((i * 7 + 3) % 8) + 4,
    duration: ((i * 11 + 5) % 6) + 4,
    delay: ((i * 17 + 2) % 4),
    xDrift: ((i * 13) % 60) - 30,
    emoji: type === 'petals' ? (i % 3 === 0 ? '🌸' : i % 3 === 1 ? '💮' : '🌺')
         : type === 'balloons' ? (i % 3 === 0 ? '🎈' : i % 3 === 1 ? '🎉' : '🎊')
         : type === 'doves' ? '🕊️'
         : type === 'hearts' ? '💕'
         : type === 'stars' ? (i % 2 === 0 ? '✨' : '⭐')
         : '✨',
  })), [type]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{ left: `${p.x}%`, top: `${p.y}%`, fontSize: p.size }}
          animate={{
            y: [0, -200, -400],
            x: [0, p.xDrift],
            opacity: [0, 0.7, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeOut',
          }}
        >
          {p.emoji}
        </motion.div>
      ))}
    </div>
  );
}

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

      // Fetch event by slug (public, no user filter)
      const { data: evtRow } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slug)
        .single();

      if (evtRow) {
        // Fetch program items
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

        // Fetch venues for this event
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

        // Fetch guest groups for this event
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
    // Match by token first (most reliable)
    const byToken = guests.find(g => g.eventId === event.id && g.token === urlToken);
    if (byToken) return byToken;
    // Fallback: match by name
    if (urlGuestParam) {
      const nameParts = decodeURIComponent(urlGuestParam).replace(/-/g, ' ').toLowerCase();
      return guests.find(g =>
        g.eventId === event.id &&
        `${g.firstName} ${g.lastName}`.toLowerCase() === nameParts
      ) || null;
    }
    return null;
  }, [event, guests, urlToken, urlGuestParam]);

  const isKnownGuest = !!knownGuest;

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

  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [rsvpChoice, setRsvpChoice] = useState<'confirmed' | 'declined' | 'maybe' | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [companions, setCompanions] = useState(0);
  const [companionDetails, setCompanionDetails] = useState<{name: string; relation: string}[]>([]);
  const [privateMsg, setPrivateMsg] = useState('');
  const [allergies, setAllergies] = useState('');
  const [guestGroup, setGuestGroup] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [sweetMessage, setSweetMessage] = useState('');
  const [sweetMessageSent, setSweetMessageSent] = useState(false);

  // Pre-fill form with known guest data
  useEffect(() => {
    if (knownGuest) {
      setGuestName(`${knownGuest.firstName} ${knownGuest.lastName}`);
      setGuestPhone(knownGuest.phone || '');
      setGuestGroup(knownGuest.group || '');
      if (knownGuest.rsvpStatus && knownGuest.rsvpStatus !== 'pending') {
        setRsvpChoice(knownGuest.rsvpStatus as 'confirmed' | 'declined' | 'maybe');
        setSubmitted(true);
      }
    }
  }, [knownGuest]);

  // Hero slideshow photos (use custom heroImages if set, else defaults)
  const heroSlides = useMemo(() => {
    if (event?.heroImages && event.heroImages.length > 0) return event.heroImages;
    const defaults = ['/hero-wedding.png', '/hero-wedding-2.png', '/hero-wedding-3.png'];
    return event?.coverPhoto ? [event.coverPhoto, ...defaults.slice(1)] : defaults;
  }, [event]);

  // Auto-advance slides every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex(prev => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const prevSlide = useCallback(() => {
    setSlideIndex(prev => (prev - 1 + heroSlides.length) % heroSlides.length);
  }, [heroSlides.length]);

  const nextSlide = useCallback(() => {
    setSlideIndex(prev => (prev + 1) % heroSlides.length);
  }, [heroSlides.length]);

  useEffect(() => {
    if (!event) return;
    const target = new Date(event.date + 'T' + event.time).getTime();
    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [event]);

  const handleSubmit = () => {
    if (!rsvpChoice) return;
    if (!guestName.trim()) return;

    if (knownGuest) {
      // Update existing guest
      updateGuest(knownGuest.id, {
        rsvpStatus: rsvpChoice,
        companions,
        privateMessage: privateMsg,
        allergies,
        respondedAt: new Date().toISOString(),
      });
    } else {
      // Add as new guest
      const id = `g-${Date.now()}`;
      const [first, ...rest] = guestName.trim().split(' ');
      addGuest({
        id,
        eventId: event!.id,
        firstName: first,
        lastName: rest.join(' ') || '',
        phone: guestPhone,
        group: guestGroup || 'Invités',
        rsvpStatus: rsvpChoice,
        token: `tok-${Date.now()}`,
        companions,
        privateMessage: privateMsg,
        allergies,
        dietaryRestrictions: [],
        respondedAt: new Date().toISOString(),
      });
    }

    setSubmitted(true);
    if (rsvpChoice === 'confirmed') {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    }
  };

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
  const heroTitle = event.type === 'wedding' && event.meta.groomName && event.meta.brideName
    ? `${event.meta.groomName} & ${event.meta.brideName}`
    : event.type === 'birthday' && event.meta.celebrantName && event.meta.age
    ? `Les ${event.meta.age} ans de ${event.meta.celebrantName}`
    : event.name;

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--bg)' }}>
      {/* Confetti explosion */}
      {showConfetti && <Particles type="stars" />}

      {/* ── HERO — Photo Slideshow + Fade ─────── */}
      <section style={{ position: 'relative' }}>
        {/* Photo area — full viewport height */}
        <div style={{
          position: 'relative',
          height: '100vh',
          overflow: 'hidden',
        }}>
          {/* Slideshow photos — Ken Burns effect */}
          <AnimatePresence mode="wait">
            <motion.div
              key={slideIndex}
              style={{
                position: 'absolute',
                inset: '-5%',
                width: '110%',
                height: '110%',
                backgroundImage: `url(${heroSlides[slideIndex]})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center center',
              }}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{
                opacity: 1,
                scale: [1.1, 1.0],
                transition: {
                  opacity: { duration: 0.8, ease: 'easeOut' },
                  scale: { duration: 6, ease: 'linear' },
                },
              }}
              exit={{
                opacity: 0,
                scale: 0.98,
                transition: { duration: 0.6, ease: 'easeIn' },
              }}
            />
          </AnimatePresence>

          {/* Dark overlay for text readability */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.6) 100%)',
          }} />

          {/* Bottom gradient fade to white */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '40%',
            background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.85) 75%, #FFFFFF 100%)',
            zIndex: 2,
          }} />

          {/* Content overlay on photo */}
          <motion.div
            style={{
              position: 'relative',
              zIndex: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: '100%',
              padding: '3rem 1.5rem',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
          >
            {/* Top: icon + event type */}
            <motion.div
              style={{ textAlign: 'center', paddingTop: '1rem' }}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {/* Wedding rings icon */}
              {event.type === 'wedding' ? (
                <div style={{ margin: '0 auto 0.75rem' }}>
                  <svg width="40" height="40" viewBox="0 0 48 48" fill="none" style={{ margin: '0 auto' }}>
                    <circle cx="18" cy="24" r="10" stroke="#C8A96E" strokeWidth="2" fill="none" />
                    <circle cx="30" cy="24" r="10" stroke="#C8A96E" strokeWidth="2" fill="none" />
                  </svg>
                </div>
              ) : (
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{cfg.emoji}</div>
              )}
              <div
                className="font-body"
                style={{
                  fontSize: '0.7rem',
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.85)',
                  fontWeight: 500,
                }}
              >
                {event.type === 'wedding' ? 'Célébration de Mariage' : cfg.label}
              </div>
            </motion.div>

            {/* Center: "Invitation" in script */}
            <motion.div
              style={{ textAlign: 'center' }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <h1
                className="font-script"
                style={{
                  fontSize: 'clamp(4.5rem, 14vw, 7.5rem)',
                  color: '#FFFFFF',
                  fontWeight: 400,
                  lineHeight: 1,
                  textShadow: '0 2px 20px rgba(0,0,0,0.3)',
                }}
              >
                Invitation
              </h1>
            </motion.div>

            {/* Bottom: "DÉFILER" + scroll icon */}
            <motion.div
              style={{ textAlign: 'center', paddingBottom: '1rem', zIndex: 5 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              <div
                className="font-body"
                style={{
                  fontSize: '0.7rem',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'rgba(100,90,80,0.6)',
                  marginBottom: '0.5rem',
                }}
              >
                Défiler
              </div>
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <ChevronDown size={22} style={{ color: 'rgba(100,90,80,0.5)', margin: '0 auto' }} />
              </motion.div>
            </motion.div>
          </motion.div>

          {/* ── Slide navigation arrows ── */}
          <button
            onClick={prevSlide}
            aria-label="Photo précédente"
            style={{
              position: 'absolute',
              left: '0.75rem',
              top: '45%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.25)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Photo suivante"
            style={{
              position: 'absolute',
              right: '0.75rem',
              top: '45%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.25)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <ChevronRight size={22} />
          </button>

          {/* Slide indicator dots */}
          <div style={{
            position: 'absolute',
            bottom: '11rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            display: 'flex',
            gap: '0.5rem',
          }}>
            {heroSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlideIndex(i)}
                aria-label={`Photo ${i + 1}`}
                style={{
                  width: slideIndex === i ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  background: slideIndex === i ? '#C8A96E' : 'rgba(255,255,255,0.5)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  padding: 0,
                }}
              />
            ))}
          </div>
        </div>

        {/* Names + Details — on white background below the fade */}
        <div style={{
          background: '#FFFFFF',
          textAlign: 'center',
          padding: '2rem 1.5rem 3rem',
          marginTop: '-1px',
        }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div
              className="font-body"
              style={{
                fontSize: '0.7rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: '1.5rem',
              }}
            >
              {event.type === 'wedding' ? 'Bienvenue à notre célébration' : `Vous êtes invité(e) à`}
            </div>

            <h2
              className="font-display"
              style={{
                fontSize: 'clamp(2.5rem, 7vw, 4rem)',
                fontWeight: 700,
                color: 'var(--text)',
                lineHeight: 1.2,
                marginBottom: '0.5rem',
              }}
            >
              {event.type === 'wedding' && event.meta.groomName && event.meta.brideName ? (
                <>
                  {event.meta.groomName}
                  <br />
                  <span className="font-script" style={{ color: 'var(--gold)', fontSize: '0.6em', fontWeight: 400 }}>&</span>
                  <br />
                  {event.meta.brideName}
                </>
              ) : (
                heroTitle
              )}
            </h2>

            {/* Date & venue info */}
            <div
              className="font-display italic"
              style={{
                fontSize: '1rem',
                color: 'var(--text-secondary)',
                marginTop: '1.5rem',
                marginBottom: '2rem',
              }}
            >
              <span className="flex items-center justify-center gap-1.5" style={{ marginBottom: '0.25rem' }}>
                <CalendarDays size={15} /> {new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                <span style={{ margin: '0 0.5rem' }}>•</span>
                <Clock size={15} /> {event.time}
              </span>
              <span className="flex items-center justify-center gap-1.5">
                <MapPin size={15} /> {event.venue}
              </span>
            </div>

            {/* Countdown */}
            <motion.div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
                background: 'linear-gradient(135deg, #C8A96E, #D4B87A)',
                padding: '1.25rem 2rem',
                borderRadius: '1rem',
              }}
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
            >
              <CountdownUnit value={countdown.days} label="Jours" />
              <div className="text-xl font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>:</div>
              <CountdownUnit value={countdown.hours} label="Heures" />
              <div className="text-xl font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>:</div>
              <CountdownUnit value={countdown.minutes} label="Min" />
              <div className="text-xl font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>:</div>
              <CountdownUnit value={countdown.seconds} label="Sec" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── WELCOME MESSAGE ────────────────────── */}
      {event.welcomeMessage && (
        <section style={{ background: 'var(--bg)', padding: '5rem 1.5rem' }}>
          <motion.div
            style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          >
            {event.type === 'wedding' && <Heart size={32} style={{ color: 'var(--rose-deep)', margin: '0 auto 1rem' }} />}
            <p className="font-display text-xl md:text-2xl italic leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              &ldquo;{event.welcomeMessage}&rdquo;
            </p>
          </motion.div>
        </section>
      )}

      {/* ── PROGRAMME ──────────────────────────── */}
      {event.program.length > 0 && (
      <section style={{ background: 'var(--bg-section)', padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: 576, margin: '0 auto' }}>
          <motion.h2
            className="font-display text-3xl font-bold"
            style={{ textAlign: 'center', marginBottom: '3rem' }}
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          >
            Programme de la <span className="gradient-gold">journée</span>
          </motion.h2>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            {event.program.map((item, idx) => {
              const venue = item.venueId ? allVenues.find(v => v.id === item.venueId) : null;
              return (
                <div key={item.id} style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
                  {/* Vertical line */}
                  {idx < event.program.length - 1 && (
                    <div style={{
                      position: 'absolute', left: 19, top: 40, bottom: 0, width: 2,
                      background: 'linear-gradient(to bottom, var(--gold), rgba(200,169,110,0.2))',
                    }} />
                  )}
                  {/* Number circle */}
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, var(--gold), var(--gold-light))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: '0.9rem', zIndex: 1,
                  }}>{idx + 1}</div>
                  {/* Content */}
                  <div style={{
                    flex: 1, paddingBottom: idx < event.program.length - 1 ? '1.5rem' : '0',
                  }}>
                    <div style={{
                      background: 'var(--bg-card)', border: '1px solid var(--border-light)',
                      borderRadius: 14, padding: '0.85rem 1rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                        <span style={{
                          fontSize: '0.7rem', fontWeight: 700, color: 'var(--gold)',
                          padding: '0.15rem 0.5rem', borderRadius: 6,
                          background: 'rgba(200,169,110,0.1)',
                        }}>{item.time}</span>
                        <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                      </div>
                      <div className="font-semibold" style={{ fontSize: '0.9rem' }}>{item.title}</div>
                      {item.description && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{item.description}</div>
                      )}
                      {venue && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.35rem', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <MapPin size={11} /> {venue.name}
                          </div>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${venue.lat},${venue.lng}`}
                            target="_blank" rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                              fontSize: '0.6rem', fontWeight: 600, color: 'var(--gold)',
                              padding: '0.15rem 0.4rem', borderRadius: 5,
                              background: 'rgba(200,169,110,0.1)', textDecoration: 'none',
                              flexShrink: 0,
                            }}
                          >
                            <Navigation size={9} /> Maps
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </section>
      )}

      {/* ── DRESS CODE ─────────────────────────── */}
      {event.dressCode && (
        <section style={{ background: 'var(--bg)', padding: '4rem 1.5rem' }}>
          <motion.div
            className="card glass-gold"
            style={{ maxWidth: 448, margin: '0 auto', textAlign: 'center' }}
            initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          >
            <div className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--gold)' }}>Dress Code</div>
            <p className="text-lg">{event.dressCode}</p>
            <div className="flex items-center justify-center gap-3 mt-4">
              <div className="w-8 h-8 rounded-full border-2" style={{ background: event.primaryColor, borderColor: 'rgba(0,0,0,0.1)' }} />
              <div className="w-8 h-8 rounded-full border-2" style={{ background: event.secondaryColor, borderColor: 'rgba(0,0,0,0.1)' }} />
            </div>
          </motion.div>
        </section>
      )}

      {/* ── LOCALISATION (Google Maps) ──────────── */}
      <section style={{ background: 'var(--bg-section)', padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <motion.div
            style={{ textAlign: 'center', marginBottom: '2rem' }}
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl font-bold mb-2">
              Comment <span className="gradient-gold">nous rejoindre</span>
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {itineraryStops.length > 1
                ? 'Suivez l\'itinéraire entre les différents lieux de la journée'
                : 'Retrouvez-nous à l\'adresse ci-dessous'}
            </p>
          </motion.div>


          {/* Map */}
          <motion.div
            className="card"
            style={{ padding: 0, overflow: 'hidden' }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div style={{ width: '100%', height: 320, position: 'relative' }}>
              {itineraryStops.length > 1 ? (
                <iframe
                  title="Itinéraire"
                  width="100%" height="100%" style={{ border: 0 }} loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps/embed/v1/directions?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&origin=${itineraryStops[0].venue.lat || 0},${itineraryStops[0].venue.lng || 0}&destination=${itineraryStops[itineraryStops.length - 1].venue.lat || 0},${itineraryStops[itineraryStops.length - 1].venue.lng || 0}${itineraryStops.length > 2 ? '&waypoints=' + itineraryStops.slice(1, -1).map(s => `${s.venue.lat || 0},${s.venue.lng || 0}`).join('|') : ''}&mode=driving`}
                />
              ) : (
                <iframe
                  title="Lieu de l'événement"
                  width="100%" height="100%" style={{ border: 0 }} loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(event.venue + ', ' + (event.venueAddress || ''))}&zoom=15`}
                />
              )}
            </div>

            <div style={{ padding: '1rem 1.5rem' }}>
              <a
                href={itineraryStops.length > 1
                  ? `https://www.google.com/maps/dir/${itineraryStops.map(s => `${s.venue.lat || 0},${s.venue.lng || 0}`).join('/')}`
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue + ', ' + (event.venueAddress || ''))}`
                }
                target="_blank" rel="noopener noreferrer" className="btn-secondary"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none', width: '100%' }}
              >
                <Navigation size={16} />
                {itineraryStops.length > 1 ? 'Voir l\'itinéraire complet' : 'Ouvrir dans Google Maps'}
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── RSVP ───────────────────────────────── */}
      <section style={{ background: 'var(--bg-section)', padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: 512, margin: '0 auto' }}>
          <motion.div
            style={{ textAlign: 'center', marginBottom: '2.5rem' }}
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl font-bold mb-2">
              Confirmez votre <span className="gradient-gold">présence</span>
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nous avons hâte de savoir si vous serez des nôtres</p>
          </motion.div>

          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.div
                key="form"
                className="card"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              >
                {/* Known guest banner */}
                {isKnownGuest && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    padding: '0.75rem 1rem', marginBottom: '1.25rem',
                    background: 'rgba(200,169,110,0.08)', border: '1px solid rgba(200,169,110,0.2)',
                    borderRadius: 12,
                  }}>
                    <Check size={16} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Bienvenue <strong style={{ color: 'var(--gold)' }}>{guestName}</strong> ! Vos informations sont pré-remplies.
                    </span>
                  </div>
                )}

                {/* Name */}
                <div className="mb-4">
                  <label className="label">Votre nom complet *</label>
                  <input
                    className="input"
                    placeholder="Prénom Nom"
                    value={guestName}
                    onChange={e => !isKnownGuest && setGuestName(e.target.value)}
                    readOnly={isKnownGuest}
                    style={isKnownGuest ? { background: 'var(--glass)', color: 'var(--text-secondary)', cursor: 'not-allowed', opacity: 0.85 } : undefined}
                  />
                </div>

                {/* Phone */}
                <div className="mb-6">
                  <label className="label">Numéro de téléphone</label>
                  <input
                    className="input"
                    placeholder="+225 07 XX XX XX"
                    value={guestPhone}
                    onChange={e => !isKnownGuest && setGuestPhone(e.target.value)}
                    readOnly={isKnownGuest}
                    style={isKnownGuest ? { background: 'var(--glass)', color: 'var(--text-secondary)', cursor: 'not-allowed', opacity: 0.85 } : undefined}
                  />
                </div>

                {/* Group */}
                {isKnownGuest && guestGroup ? (
                  <div className="mb-6">
                    <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Users size={14} style={{ color: 'var(--gold)' }} />
                      Votre groupe
                    </label>
                    <div style={{
                      padding: '0.65rem 0.85rem', borderRadius: 10,
                      background: 'var(--glass)', border: '1px solid var(--border-light)',
                      fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500,
                    }}>
                      {guestGroup}
                    </div>
                  </div>
                ) : allGroups.length > 0 && (
                  <div className="mb-6">
                    <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Users size={14} style={{ color: 'var(--gold)' }} />
                      Votre groupe
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem' }}>
                      {allGroups.map(g => {
                        const selected = guestGroup === g.name;
                        return (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => setGuestGroup(g.name)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '0.45rem',
                              padding: '0.6rem 0.75rem', borderRadius: 10,
                              background: selected ? 'rgba(200,169,110,0.1)' : 'var(--glass)',
                              border: `1.5px solid ${selected ? 'var(--gold)' : 'var(--border-light)'}`,
                              color: selected ? 'var(--gold)' : 'var(--text-muted)',
                              cursor: 'pointer', transition: 'all 0.2s',
                              fontWeight: selected ? 600 : 400, fontSize: '0.8rem',
                            }}
                          >
                            <span style={{ fontSize: '1rem' }}>{g.emoji}</span>
                            {g.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* RSVP buttons */}
                <div className="mb-6">
                  <label className="label">Votre réponse *</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'confirmed' as const, label: 'Je serai là !', icon: Check, color: '#22964F', bg: 'rgba(34,150,80,0.08)' },
                      { value: 'declined' as const, label: 'Absent(e)', icon: X, color: '#DC3545', bg: 'rgba(220,53,69,0.06)' },
                      { value: 'maybe' as const, label: 'Peut-être', icon: HelpCircle, color: '#7C58BA', bg: 'rgba(124,88,186,0.06)' },
                    ].map(opt => {
                      const Icon = opt.icon;
                      const selected = rsvpChoice === opt.value;
                      return (
                        <button
                          key={opt.value}
                          className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all"
                          style={{
                            background: selected ? opt.bg : 'var(--glass)',
                            border: `2px solid ${selected ? opt.color : 'var(--border-light)'}`,
                            color: selected ? opt.color : 'var(--text-muted)',
                            cursor: 'pointer',
                          }}
                          onClick={() => setRsvpChoice(opt.value)}
                        >
                          <Icon size={24} />
                          <span className="text-xs font-medium">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Extra fields if confirmed */}
                <AnimatePresence>
                  {rsvpChoice === 'confirmed' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} className="overflow-hidden"
                    >
                      <div className="space-y-4 mb-6">
                        {/* Companions — only if organizer enabled it */}
                        {event.allowCompanions && (
                          <div>
                            <label className="label flex items-center gap-2">
                              <Users size={14} style={{ color: 'var(--gold)' }} />
                              Nombre d&apos;accompagnants
                            </label>
                            <select
                              className="input"
                              value={companions}
                              onChange={e => {
                                const n = Number(e.target.value);
                                setCompanions(n);
                                setCompanionDetails(prev => {
                                  const arr = [...prev];
                                  while (arr.length < n) arr.push({ name: '', relation: '' });
                                  return arr.slice(0, n);
                                });
                              }}
                            >
                              {Array.from({ length: (event.maxCompanions || 3) + 1 }, (_, i) => (
                                <option key={i} value={i}>{i === 0 ? 'Aucun' : `+${i}`}</option>
                              ))}
                            </select>

                            {/* Companion name + relation fields */}
                            <AnimatePresence>
                              {companions > 0 && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div style={{ marginTop: '0.75rem' }} className="space-y-3">
                                    {companionDetails.map((c, idx) => (
                                      <div
                                        key={idx}
                                        style={{
                                          padding: '0.75rem',
                                          borderRadius: '0.75rem',
                                          background: 'rgba(200,169,110,0.04)',
                                          border: '1px solid var(--border-light)',
                                        }}
                                      >
                                        <div className="text-xs font-semibold mb-2" style={{ color: 'var(--gold-dark)' }}>
                                          Accompagnant {idx + 1}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          <input
                                            className="input"
                                            placeholder="Nom complet"
                                            value={c.name}
                                            onChange={e => {
                                              const arr = [...companionDetails];
                                              arr[idx] = { ...arr[idx], name: e.target.value };
                                              setCompanionDetails(arr);
                                            }}
                                          />
                                          <select
                                            className="input"
                                            value={c.relation}
                                            onChange={e => {
                                              const arr = [...companionDetails];
                                              arr[idx] = { ...arr[idx], relation: e.target.value };
                                              setCompanionDetails(arr);
                                            }}
                                          >
                                            <option value="">Lien / Filiation</option>
                                            <option value="conjoint">Conjoint(e)</option>
                                            <option value="enfant">Enfant</option>
                                            <option value="parent">Parent</option>
                                            <option value="frere_soeur">Frère / Sœur</option>
                                            <option value="ami">Ami(e)</option>
                                            <option value="collegue">Collègue</option>
                                            <option value="autre">Autre</option>
                                          </select>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}

                        <div>
                          <label className="label">Allergies / Régime alimentaire (optionnel)</label>
                          <input className="input" placeholder="Ex: Sans gluten, halal, végétarien..." value={allergies} onChange={e => setAllergies(e.target.value)} />
                        </div>
                        <div>
                          <label className="label">Message privé (optionnel)</label>
                          <textarea className="input" rows={3} placeholder="Un mot pour les organisateurs..." value={privateMsg} onChange={e => setPrivateMsg(e.target.value)} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  className="btn-primary w-full py-3"
                  onClick={handleSubmit}
                  disabled={!rsvpChoice || !guestName.trim()}
                  style={{ opacity: (!rsvpChoice || !guestName.trim()) ? 0.5 : 1, marginTop: '1.5rem' }}
                >
                  Confirmer ma réponse
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                className="card text-center py-12"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              >
                {rsvpChoice === 'confirmed' ? (
                  <>
                    <motion.div
                      className="text-6xl mb-4"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.5 }}
                    >
                      🎉
                    </motion.div>
                    <h3 className="font-display text-2xl font-bold mb-2">Merci {guestName.split(' ')[0]} !</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Votre présence est confirmée. Nous avons hâte de vous retrouver !</p>
                  </>
                ) : rsvpChoice === 'declined' ? (
                  <>
                    <div className="text-5xl mb-4">😢</div>
                    <h3 className="font-display text-2xl font-bold mb-2">C&apos;est noté</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Nous comprenons. Vous nous manquerez !</p>
                  </>
                ) : (
                  <>
                    <div className="text-5xl mb-4">🤔</div>
                    <h3 className="font-display text-2xl font-bold mb-2">Pas de souci !</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Prenez votre temps. Nous vous relancerons bientôt.</p>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ── MOT DOUX ─────────────────────────────── */}
      <section style={{ background: 'var(--bg)', padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: 512, margin: '0 auto' }}>
          <motion.div
            style={{ textAlign: 'center', marginBottom: '2rem' }}
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          >
            <MessageCircleHeart size={32} style={{ color: 'var(--gold)', margin: '0 auto 1rem' }} />
            <h2 className="font-display text-3xl font-bold mb-2">
              Un petit <span className="gradient-gold">mot doux</span>
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Laissez un message personnel aux organisateurs
            </p>
          </motion.div>

          <motion.div
            className="card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <AnimatePresence mode="wait">
              {!sweetMessageSent ? (
                <motion.div
                  key="sweet-form"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }}
                >
                  <textarea
                    className="input"
                    rows={4}
                    placeholder="Vos vœux de bonheur, une anecdote, un souvenir partagé..."
                    value={sweetMessage}
                    onChange={e => setSweetMessage(e.target.value)}
                    style={{ resize: 'none', marginBottom: '1rem' }}
                  />
                  <button
                    className="btn-primary w-full py-3"
                    onClick={async () => {
                      if (!sweetMessage.trim() || !event) return;
                      try {
                        const { createClient } = await import('@/lib/supabase/client');
                        const supabase = createClient();
                        await supabase.from('sweet_messages').insert({
                          event_id: event.id,
                          author_name: guestName || 'Anonyme',
                          message: sweetMessage.trim(),
                        });
                      } catch (e) {
                        console.warn('Sweet message save failed (table may not exist):', e);
                      }
                      setSweetMessageSent(true);
                    }}
                    disabled={!sweetMessage.trim()}
                    style={{ opacity: !sweetMessage.trim() ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    <Send size={16} />
                    Envoyer mon message
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="sweet-success"
                  className="text-center py-6"
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                >
                  <motion.div
                    className="text-5xl mb-3"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5 }}
                  >
                    💌
                  </motion.div>
                  <h3 className="font-display text-xl font-bold mb-2">Merci pour ce beau message !</h3>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Votre mot a été transmis aux organisateurs avec amour.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────── */}
      <footer className="py-8 px-6 text-center" style={{ borderTop: '1px solid var(--border-light)' }}>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Propulsé par <span className="gradient-gold font-semibold">EventOS</span>
        </p>
      </footer>
    </div>
  );
}
