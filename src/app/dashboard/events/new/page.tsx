'use client';
import Sidebar from '@/components/Sidebar';
import { useApp } from '@/context/AppContext';
import { useThemeLanguage } from '@/context/ThemeLanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { eventTypeConfig, planConfig } from '@/lib/mock-data';
import { EventType, Event, ProgramItem, Venue } from '@/lib/types';
import { VenueFormModal, VenueFormData } from '@/components/VenueFormModal';
import TemplateSelector from '@/components/TemplateSelector';
import TemplatePreview from '@/components/TemplatePreview';
import { createClient } from '@/lib/supabase/client';
import { getDefaultTemplate, getTemplate, getTemplateVariant } from '@/lib/templates/template-registry';
import type { HeroType } from '@/lib/templates/template-registry';
import {
  Sparkles, Plus, Trash2, ArrowRight, ArrowLeft, MapPin, Users,
  CalendarDays, Palette, FileText, Clock, Image, ToggleLeft, ToggleRight, CheckCircle2, Crown, LayoutTemplate, Eye, X, Upload, ImageIcon, Film, Clapperboard, RotateCcw
} from 'lucide-react';

/* ── Card wrapper for form sections (outside component to avoid re-renders) ─── */
const SectionCard = ({ children, title, icon: IconComp }: { children: React.ReactNode; title: string; icon: React.ElementType }) => (
  <div style={{
    background: 'var(--bg-card)',
    borderRadius: '1.25rem',
    border: '1px solid var(--border-light)',
    padding: '1.75rem',
    marginBottom: '1.5rem',
    boxShadow: '0 4px 24px rgba(0,0,0,0.03)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10,
        background: 'rgba(200, 169, 110, 0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--gold)',
      }}>
        <IconComp size={18} />
      </div>
      <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text)' }}>{title}</h3>
    </div>
    {children}
  </div>
);

export default function NewEventPage() {
  const router = useRouter();
  const { addEvent, venues, addVenue } = useApp();
  const { t } = useThemeLanguage();
  const tr = t('newEvent');
  const [step, setStep] = useState(1);
  const totalSteps = 5;
  const [selectedTemplateId, setSelectedTemplateId] = useState('romance');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Persistent event ID and venues for this draft event
  const [newEventId] = useState(() => crypto.randomUUID());
  const [newEventVenues, setNewEventVenues] = useState<Venue[]>([]);
  const [venueModalTargetItemId, setVenueModalTargetItemId] = useState<string | null>(null);

  // Combine user's existing venues and venues created in this wizard
  const allAvailableVenues = useMemo(() => {
    const list = [...newEventVenues];
    venues.forEach(v => {
      if (!list.some(existing => existing.id === v.id)) {
        list.push(v);
      }
    });
    return list;
  }, [newEventVenues, venues]);

  const [eventType, setEventType] = useState<EventType>('wedding');
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('14:00');
  const [venue, setVenue] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [dressCode, setDressCode] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#D4AF37');
  const [secondaryColor, setSecondaryColor] = useState('#F7C5CC');

  // Hero
  const [heroType, setHeroType] = useState<HeroType>('image');
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [hideDefault, setHideDefault] = useState(false);
  const [heroVideo, setHeroVideo] = useState<string>('/default_video.mp4');

  // Companions
  const [allowCompanions, setAllowCompanions] = useState(false);
  const [maxCompanions, setMaxCompanions] = useState(2);

  // Meta
  const [brideName, setBrideName] = useState('');
  const [groomName, setGroomName] = useState('');
  const [celebrantName, setCelebrantName] = useState('');
  const [age, setAge] = useState('');

  // Program
  const [program, setProgram] = useState<ProgramItem[]>([
    { id: 'p-1', time: '14:00', title: '', description: '', icon: '🎉' },
  ]);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState<string | null>(null);
  const emojiOptions = ['🎉','💒','🍽️','💃','🎂','🎵','📸','🥂','💐','🎤','🚗','⛪','💍','🎊','🌙','🕌','🏨','🎶','🌸','✨','🙏','👰','🤵','🎀','💝'];

  // Inline venue creation
  const [showVenueModal, setShowVenueModal] = useState(false);

  // Mobile preview drawer
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  const handleAddVenue = async (data: VenueFormData) => {
    const trimmedName = data.name.trim();
    // Check if a venue with the same name already exists for this user
    const existing = allAvailableVenues.find(v => v.name.trim().toLowerCase() === trimmedName.toLowerCase());

    if (existing) {
      // Reuse existing venue for this user account
      if (venueModalTargetItemId) {
        setProgram(p => p.map(i => i.id === venueModalTargetItemId ? { ...i, venueId: existing.id } : i));
      } else {
        setProgram(p => {
          const idx = p.findIndex(item => !item.venueId);
          if (idx !== -1) {
            const next = [...p];
            next[idx] = { ...next[idx], venueId: existing.id };
            return next;
          }
          // If all items already have a venue, add a new step with this existing venue
          return [...p, {
            id: `p-${Date.now()}`,
            time: '15:00',
            title: '',
            description: '',
            icon: '🎉',
            venueId: existing.id,
          }];
        });
      }
      setShowVenueModal(false);
      setVenueModalTargetItemId(null);
      return;
    }

    const venueItem: Venue = {
      id: crypto.randomUUID(),
      eventId: newEventId,
      name: trimmedName,
      address: data.address.trim(),
      emoji: data.emoji || '📍',
      lat: data.lat,
      lng: data.lng,
    };

    // Immediate UI feedback
    setNewEventVenues(prev => [...prev, venueItem]);

    // If opened from a specific program item, assign it to that item
    if (venueModalTargetItemId) {
      setProgram(p => p.map(i => i.id === venueModalTargetItemId ? { ...i, venueId: venueItem.id } : i));
    } else {
      // Auto-assign to the first step that doesn't have a venue, or create a new step
      setProgram(p => {
        const idx = p.findIndex(item => !item.venueId);
        if (idx !== -1) {
          const next = [...p];
          next[idx] = { ...next[idx], venueId: venueItem.id };
          return next;
        }
        // If all existing steps already have a venue, auto-append a new step with this 2nd venue
        return [...p, {
          id: `p-${Date.now()}`,
          time: '15:00',
          title: '',
          description: '',
          icon: '🎉',
          venueId: venueItem.id,
        }];
      });
    }

    setShowVenueModal(false);
    setVenueModalTargetItemId(null);

    // Persist immediately via /api/venues (service role ensures event exists with valid date fallback)
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const draftSlug = generateSlug();
      const res = await fetch('/api/venues', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...venueItem,
          draftEvent: {
            name: name || `${eventTypeConfig[eventType].label}`,
            slug: draftSlug,
            type: eventType,
            date: date || new Date().toISOString().split('T')[0],
            time: time || '14:00',
            primaryColor,
            secondaryColor,
            plan: selectedPlan,
          },
        }),
      });
      const resJson = await res.json();
      if (res.ok && resJson.venue) {
        setNewEventVenues(prev => prev.map(v => v.id === venueItem.id ? resJson.venue : v));
      }
    } catch (err) {
      console.error('Error saving venue from popup:', err);
    }
  };

  const addProgramItem = () => {
    setProgram(p => [...p, { id: `p-${Date.now()}`, time: '', title: '', description: '', icon: '🎉' }]);
  };
  const removeProgramItem = (id: string) => {
    setProgram(p => p.filter(i => i.id !== id));
  };
  const updateProgramItem = (id: string, updates: Partial<ProgramItem>) => {
    setProgram(p => p.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const generateSlug = () => {
    const prefix = eventType === 'wedding' ? `mariage-${groomName || ''}-et-${brideName || ''}`
      : eventType === 'birthday' ? `anniversaire-${celebrantName || ''}-${age || ''}ans`
      : name;
    const cleanPrefix = (prefix || 'evenement').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/--+/g, '-').replace(/^-|-$/g, '') || 'evenement';
    const year = date ? new Date(date).getFullYear() : new Date().getFullYear();
    const shortId = newEventId.slice(0, 6);
    return `${cleanPrefix}-${year}-${shortId}`;
  };

  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  const handleCreate = async () => {
    if (isCreatingEvent) return;
    setIsCreatingEvent(true);
    try {
      const slug = generateSlug();
      const template = getDefaultTemplate(eventType);
      const newEvent: Event = {
        id: newEventId, slug, type: eventType,
        name: name || `${eventTypeConfig[eventType].label}`,
        date, time, venue, venueAddress, dressCode, welcomeMessage,
        theme: eventType, primaryColor, secondaryColor,
        allowCompanions, maxCompanions: allowCompanions ? maxCompanions : undefined,
        program: program.filter(p => p.title),
        meta: {
          brideName: eventType === 'wedding' ? brideName : undefined,
          groomName: eventType === 'wedding' ? groomName : undefined,
          celebrantName: eventType === 'birthday' ? celebrantName : undefined,
          age: eventType === 'birthday' ? Number(age) : undefined,
        },
        plan: (selectedPlan as 'essentiel' | 'pro' | 'premium') || undefined,
        templateId: selectedTemplateId,
        heroType,
        heroImages: heroImages.length > 0 ? heroImages : undefined,
        heroVideo: heroType === 'video' ? heroVideo : undefined,
        createdAt: new Date().toISOString(),
      };
      await addEvent(newEvent, newEventVenues);
      router.push('/dashboard');
    } catch (err) {
      console.error('Error creating event:', err);
      setIsCreatingEvent(false);
    }
  };

  const stepLabels = [tr.step1, tr.step2, tr.step3, tr.step4, tr.step5];

  return (
    <div className="flex">
      <Sidebar />
      <main className="main-content">
        <div className="new-event-layout" style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        {/* Form column */}
        <div className="new-event-form" style={{ flex: '1 1 0', maxWidth: selectedPlan ? 680 : '100%', minWidth: 0 }}>
          {!selectedPlan ? (
            /* ── Plan Selection ─────────────── */
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <h1 className="font-display text-2xl font-bold" style={{ marginBottom: '0.5rem' }}>
                  <Crown size={22} style={{ display: 'inline', marginRight: '0.5rem', color: 'var(--gold)' }} />
                  {tr.choosePlan}
                </h1>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {tr.selectPlan}
                </p>
              </div>

              <div style={{ display: 'grid', gap: '1rem' }}>
                {[
                  { key: 'essentiel', price: '19 000', features: ['100 invités max', 'Invitations & RSVP', 'Landing animée', 'Dashboard RSVP', 'Lien personnalisé'] },
                  { key: 'pro', price: '49 000', popular: true, features: ['300 invités max', 'Tout Essentiel +', 'Menu & sondage', 'Plan de salle', 'Relances automatiques', 'Export traiteur'] },
                  { key: 'premium', price: '99 000', features: ['Invités illimités', 'Tout Pro +', 'Live Jour J (QR)', 'Kitchen Display', 'Waiter App', 'Analytics avancés', 'URL personnalisé'] },
                ].map((p) => {
                  const cfg = planConfig[p.key];
                  return (
                    <motion.button
                      key={p.key}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedPlan(p.key)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '1.25rem',
                        padding: '1.25rem 1.5rem', borderRadius: '1.25rem', cursor: 'pointer',
                        background: (p as {popular?: boolean}).popular ? 'rgba(200,169,110,0.04)' : 'var(--bg-card)',
                        border: (p as {popular?: boolean}).popular ? '1.5px solid var(--gold)' : '1px solid var(--border-light)',
                        textAlign: 'left', width: '100%', position: 'relative',
                      }}
                    >
                      {(p as {popular?: boolean}).popular && (
                        <div style={{
                          position: 'absolute', top: -10, right: 16,
                          fontSize: '0.6rem', fontWeight: 700, padding: '0.15rem 0.6rem', borderRadius: 6,
                          background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', color: '#fff',
                          letterSpacing: '0.04em',
                        }}>{tr.popular}</div>
                      )}
                      <div style={{
                        width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                        background: `${cfg.color}12`, border: `1px solid ${cfg.color}25`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.4rem',
                      }}>{cfg.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span className="font-semibold" style={{ fontSize: '1.05rem' }}>{cfg.label}</span>
                          <span className="font-bold" style={{ color: cfg.color, fontSize: '0.95rem' }}>{p.price} FCFA</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                          {p.features.map(f => (
                            <span key={f} style={{
                              fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: 5,
                              background: 'var(--glass)', color: 'var(--text-muted)',
                              border: '1px solid var(--glass-border)',
                            }}>
                              <CheckCircle2 size={9} style={{ display: 'inline', marginRight: 2, color: '#22964F' }} />
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                      <ArrowRight size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <h1 className="font-display text-2xl font-bold">
                  <Sparkles size={22} style={{ display: 'inline', marginRight: '0.5rem', color: 'var(--gold)' }} />
                  {tr.title}
                </h1>
                {selectedPlan && planConfig[selectedPlan] && (
                  <span style={{
                    fontSize: '0.6rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 6,
                    background: `${planConfig[selectedPlan].color}15`, color: planConfig[selectedPlan].color,
                    border: `1px solid ${planConfig[selectedPlan].color}30`,
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                    cursor: 'pointer',
                  }} onClick={() => { setSelectedPlan(null); setStep(1); }}>
                    {planConfig[selectedPlan].icon} {planConfig[selectedPlan].label} ✕
                  </span>
                )}
              </div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {tr.stepOf.replace('{step}', String(step)).replace('{total}', String(totalSteps))} — {stepLabels[step - 1]}
              </p>
            </div>

            {/* Step indicator — premium dots + labels */}
            <div style={{
              display: 'flex', gap: '0.5rem', marginBottom: '2rem',
              background: 'var(--bg-card)', border: '1px solid var(--border-light)',
              borderRadius: '0.75rem', padding: '0.75rem 1rem',
              overflowX: 'auto', WebkitOverflowScrolling: 'touch',
            }}>
              {stepLabels.map((label, i) => {
                const s = i + 1;
                const isActive = s === step;
                const isDone = s < step;
                return (
                  <button
                    key={s}
                    onClick={() => { if (isDone) setStep(s); }}
                    style={{
                      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem',
                      background: 'none', border: 'none', cursor: isDone ? 'pointer' : 'default', padding: 0,
                    }}
                  >
                    <div style={{
                      width: '100%', height: 4, borderRadius: 2,
                      background: isDone ? 'var(--gold)' : isActive ? 'linear-gradient(90deg, var(--gold), var(--gold-light))' : 'var(--glass)',
                      transition: 'all 0.3s ease',
                    }} />
                    <span style={{
                      fontSize: '0.65rem', fontWeight: isActive ? 600 : 400,
                      color: isActive ? 'var(--gold)' : isDone ? 'var(--text)' : 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                    }}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* ── Step 1: Type & Basic Info ──────── */}
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <SectionCard title={tr.eventType} icon={Sparkles}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {Object.entries(eventTypeConfig).map(([key, cfg]) => (
                      <button
                        key={key}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                          padding: '1rem 0.5rem', borderRadius: '0.85rem',
                          background: eventType === key ? `${cfg.color}15` : 'var(--glass)',
                          border: `2px solid ${eventType === key ? cfg.color : 'var(--glass-border)'}`,
                          cursor: 'pointer', color: 'inherit',
                          transition: 'all 0.2s ease',
                          boxShadow: eventType === key ? `0 4px 15px ${cfg.color}20` : 'none',
                        }}
                        onClick={() => setEventType(key as EventType)}
                      >
                        <span style={{ fontSize: '1.75rem' }}>{cfg.emoji}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>{cfg.label}</span>
                      </button>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title={tr.mainInfo} icon={FileText}>
                  {/* Dynamic fields by type */}
                  {eventType === 'wedding' && (
                    <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '1rem' }}>
                      <div><label className="label">{tr.groomName}</label><input className="input" placeholder="Amadou" value={groomName} onChange={e => setGroomName(e.target.value)} /></div>
                      <div><label className="label">{tr.brideName}</label><input className="input" placeholder="Fatou" value={brideName} onChange={e => setBrideName(e.target.value)} /></div>
                    </div>
                  )}
                  {eventType === 'birthday' && (
                    <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '1rem' }}>
                      <div><label className="label">{tr.celebrantName}</label><input className="input" placeholder="Kofi" value={celebrantName} onChange={e => setCelebrantName(e.target.value)} /></div>
                      <div><label className="label">{tr.ageCelebrated}</label><input className="input" type="number" placeholder="30" value={age} onChange={e => setAge(e.target.value)} /></div>
                    </div>
                  )}
                  <div style={{ marginBottom: '1rem' }}>
                    <label className="label">{tr.name}</label>
                    <input className="input" placeholder={eventType === 'wedding' ? 'Mariage Amadou & Fatou' : eventType === 'birthday' ? 'Les 30 ans de Kofi' : 'Mon événement'} value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label className="label">{tr.date}</label><input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
                    <div><label className="label">{tr.time}</label><input className="input" type="time" value={time} onChange={e => setTime(e.target.value)} /></div>
                  </div>
                </SectionCard>

                <SectionCard title={tr.location} icon={MapPin}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label className="label">{tr.venueName}</label>
                    <input className="input" placeholder="Hôtel Ivoire" value={venue} onChange={e => setVenue(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">{tr.venueAddress}</label>
                    <input className="input" placeholder="Boulevard de France, Abidjan, Côte d'Ivoire" value={venueAddress} onChange={e => setVenueAddress(e.target.value)} />
                  </div>
                  {venueAddress && (
                    <div style={{
                      marginTop: '0.75rem', borderRadius: '0.75rem', overflow: 'hidden',
                      border: '1px solid var(--border-light)', height: 160,
                    }}>
                      <iframe
                        width="100%" height="160" frameBorder="0" style={{ border: 0 }}
                        src={`https://www.google.com/maps?q=${encodeURIComponent(venueAddress)}&output=embed`}
                        allowFullScreen loading="lazy"
                      />
                    </div>
                  )}
                </SectionCard>
              </motion.div>
            )}

            {/* ── Step 2: Details & Options ──────────── */}
            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <SectionCard title={tr.messageAndDressCode} icon={FileText}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label className="label">{tr.dressCode}</label>
                    <input className="input" placeholder="Tenue de soirée — Tons champagne & or" value={dressCode} onChange={e => setDressCode(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">{tr.welcomeMessage}</label>
                    <textarea className="input" rows={3} placeholder="Nous sommes ravis de partager ce moment avec vous..." value={welcomeMessage} onChange={e => setWelcomeMessage(e.target.value)} />
                  </div>
                </SectionCard>

                <SectionCard title={tr.companions} icon={Users}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.75rem 1rem', borderRadius: '0.75rem',
                    background: 'var(--glass)', border: '1px solid var(--glass-border)',
                    marginBottom: allowCompanions ? '1rem' : 0,
                  }}>
                    <div>
                      <div className="font-medium text-sm">{tr.allowCompanions}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {tr.allowCompanionsDesc}
                      </div>
                    </div>
                    <button
                      onClick={() => setAllowCompanions(!allowCompanions)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                        color: allowCompanions ? 'var(--gold)' : 'var(--text-muted)',
                        transition: 'color 0.2s ease',
                      }}
                    >
                      {allowCompanions ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                    </button>
                  </div>
                  {allowCompanions && (
                    <div>
                      <label className="label">{tr.maxCompanions}</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {[1, 2, 3, 4, 5].map(n => (
                          <button
                            key={n}
                            onClick={() => setMaxCompanions(n)}
                            style={{
                              width: 44, height: 44, borderRadius: 10,
                              background: maxCompanions === n ? 'rgba(200,169,110,0.15)' : 'var(--glass)',
                              border: `2px solid ${maxCompanions === n ? 'var(--gold)' : 'var(--glass-border)'}`,
                              cursor: 'pointer', fontWeight: 600,
                              color: maxCompanions === n ? 'var(--gold)' : 'var(--text-muted)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '1rem', transition: 'all 0.2s ease',
                            }}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </SectionCard>
              </motion.div>
            )}

            {/* ── Step 3: Template Selection ──────── */}
            {step === 3 && selectedPlan && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <SectionCard title={tr.chooseTemplate} icon={LayoutTemplate}>
                  <TemplateSelector
                    plan={selectedPlan as 'essentiel' | 'pro' | 'premium'}
                    eventType={eventType}
                    selectedTemplateId={selectedTemplateId}
                    onSelect={setSelectedTemplateId}
                  />
                </SectionCard>
              </motion.div>
            )}

            {/* ── Step 4: Personalization ──────── */}
            {step === 4 && (() => {
              const currentTemplate = getTemplate(selectedTemplateId);
              const currentVariant = getTemplateVariant(selectedTemplateId, eventType);
              const availableHeroTypes = currentTemplate?.heroTypes ?? ['image'];
              const defaultImage = currentVariant?.defaultHeroImages?.[0] ?? '';

              const HERO_LABELS: Record<string, { icon: React.ReactNode; label: string; desc: string }> = {
                image: { icon: <ImageIcon size={18} />, label: tr.fixedImage, desc: tr.fixedImageDesc },
                slideshow: { icon: <Film size={18} />, label: tr.slideshowLabel, desc: tr.slideshowDesc },
                video: { icon: <Clapperboard size={18} />, label: tr.videoLabel, desc: tr.videoDesc },
              };

              const maxImages = heroType === 'slideshow'
                ? (selectedPlan === 'premium' ? 10 : selectedPlan === 'pro' ? 5 : 1)
                : 1;

              return (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                {/* Hero type selector */}
                <SectionCard title={tr.heroType} icon={ImageIcon}>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${availableHeroTypes.length}, 1fr)`, gap: '0.75rem' }}>
                    {availableHeroTypes.map(ht => {
                      const cfg = HERO_LABELS[ht];
                      if (!cfg) return null;
                      const isActive = heroType === ht;
                      return (
                        <button
                          key={ht}
                          type="button"
                          onClick={() => setHeroType(ht)}
                          style={{
                            padding: '1rem 0.75rem',
                            borderRadius: 12,
                            border: isActive ? '2px solid var(--gold)' : '1px solid var(--border-light)',
                            background: isActive ? 'rgba(200,169,110,0.08)' : 'var(--glass)',
                            cursor: 'pointer',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                            transition: 'all 0.2s ease',
                            color: 'var(--text)',
                          }}
                        >
                          <div style={{
                            width: 40, height: 40, borderRadius: 10,
                            background: isActive ? 'rgba(200,169,110,0.15)' : 'var(--bg-warm)',
                            border: `1px solid ${isActive ? 'rgba(200,169,110,0.3)' : 'var(--border-light)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: isActive ? 'var(--gold)' : 'var(--text-muted)',
                            transition: 'all 0.2s ease',
                          }}>
                            {cfg.icon}
                          </div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{cfg.label}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>{cfg.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                  {availableHeroTypes.length === 1 && (
                    <div style={{
                      marginTop: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: 8,
                      background: 'rgba(200,169,110,0.06)', border: '1px solid rgba(200,169,110,0.12)',
                      fontSize: '0.7rem', color: 'var(--text-muted)',
                      display: 'flex', alignItems: 'center', gap: '0.3rem',
                    }}>
                      <Crown size={11} style={{ color: 'var(--gold)' }} />
                      {tr.upgradeHint}
                    </div>
                  )}
                </SectionCard>

                {/* Hero images — shown when heroType is NOT video */}
                {heroType !== 'video' && (() => {
                  const isUsingDefault = heroImages.length === 0 && !hideDefault;
                  const hasCustom = heroImages.length > 0;
                  const showImages = hasCustom ? heroImages : (isUsingDefault && defaultImage ? [defaultImage] : []);
                  const canAdd = hasCustom
                    ? heroImages.length < maxImages
                    : (!isUsingDefault || heroType === 'slideshow');

                  return (
                <SectionCard title={heroType === 'slideshow' ? `${tr.slideshowImages} (${showImages.length}/${maxImages})` : tr.heroImage} icon={Image}>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem', alignItems: 'center' }}>
                    {/* Existing images with delete cross */}
                    {showImages.map((img, i) => (
                      <div key={`img-${i}-${img.slice(-20)}`} style={{
                        width: 100, height: 70, borderRadius: 10, overflow: 'hidden',
                        border: isUsingDefault ? '2px solid var(--gold)' : '2px solid var(--border-light)',
                        position: 'relative', flexShrink: 0,
                      }}>
                        <img src={img} alt={`Hero ${i + 1}`} style={{
                          width: '100%', height: '100%', objectFit: 'cover',
                        }} />
                        {/* Delete cross — always visible */}
                        <button
                          type="button"
                          onClick={() => {
                            if (hasCustom) {
                              setHeroImages(prev => prev.filter((_, j) => j !== i));
                            } else {
                              // Removing default image
                              setHideDefault(true);
                            }
                          }}
                          style={{
                            position: 'absolute', top: 4, right: 4,
                            width: 22, height: 22, borderRadius: '50%',
                            background: 'rgba(220,53,69,0.9)', border: '2px solid rgba(255,255,255,0.8)',
                            color: '#fff', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                          }}
                        >
                          <X size={11} />
                        </button>
                        {/* Label */}
                        {isUsingDefault && (
                          <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0,
                            padding: '2px 0', textAlign: 'center',
                            background: 'rgba(0,0,0,0.55)', fontSize: '0.5rem', color: '#fff',
                            fontWeight: 600,
                          }}>{tr.defaultLabel}</div>
                        )}
                      </div>
                    ))}

                    {/* Upload button — shown when can add more */}
                    {(canAdd || showImages.length === 0) && (
                      <label style={{
                        width: 100, height: 70, borderRadius: 10,
                        border: '2px dashed var(--border-light)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        gap: '0.25rem', cursor: 'pointer',
                        color: 'var(--text-muted)', fontSize: '0.6rem',
                        transition: 'border-color 0.2s, background 0.2s',
                        background: 'var(--bg-warm)',
                      }}>
                        <Upload size={16} />
                        <span style={{ fontWeight: 500 }}>{showImages.length === 0 ? tr.choose : tr.addMore}</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          style={{ display: 'none' }}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            // Upload to Supabase Storage
                            const sb = createClient();
                            const ext = file.name.split('.').pop() || 'jpg';
                            const path = `hero/${crypto.randomUUID()}.${ext}`;
                            const { error } = await sb.storage
                              .from('event-media')
                              .upload(path, file, { cacheControl: '31536000', upsert: false });
                            if (error) {
                              console.error('Upload error:', error);
                              // Fallback to base64 if storage fails
                              const reader = new FileReader();
                              reader.onload = () => {
                                const dataUrl = reader.result as string;
                                if (heroType === 'image') setHeroImages([dataUrl]);
                                else setHeroImages(prev => [...prev, dataUrl]);
                                setHideDefault(true);
                              };
                              reader.readAsDataURL(file);
                            } else {
                              const { data: urlData } = sb.storage
                                .from('event-media')
                                .getPublicUrl(path);
                              const publicUrl = urlData.publicUrl;
                              if (heroType === 'image') {
                                setHeroImages([publicUrl]);
                              } else {
                                setHeroImages(prev => [...prev, publicUrl]);
                              }
                              setHideDefault(true);
                            }
                            e.target.value = '';
                          }}
                        />
                      </label>
                    )}
                  </div>

                  {/* Restore default button */}
                  {(hideDefault || hasCustom) && defaultImage && (
                    <button
                      type="button"
                      onClick={() => {
                        setHeroImages([]);
                        setHideDefault(false);
                      }}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                        fontSize: '0.7rem', fontWeight: 600,
                        padding: '0.4rem 0.75rem', borderRadius: 8,
                        background: 'rgba(200,169,110,0.08)', border: '1px solid rgba(200,169,110,0.2)',
                        color: 'var(--gold)', cursor: 'pointer',
                        marginBottom: '0.6rem',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <RotateCcw size={12} />
                      {tr.restoreDefault}
                    </button>
                  )}

                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                    {showImages.length === 0
                      ? tr.noImageSelected
                      : isUsingDefault
                        ? tr.defaultUsed
                        : heroType === 'slideshow'
                          ? tr.slideshowHint.replace('{n}', String(maxImages))
                          : tr.customUsed
                    }
                  </p>
                </SectionCard>
                  );
                })()}

                {/* Hero video — shown when heroType IS video */}
                {heroType === 'video' && (
                  <SectionCard title={tr.heroVideo} icon={Clapperboard}>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem', alignItems: 'center' }}>
                      {heroVideo ? (
                        <div style={{
                          width: 150, height: 100, borderRadius: 10, overflow: 'hidden',
                          border: '2px solid var(--border-light)',
                          position: 'relative', flexShrink: 0,
                        }}>
                          <video
                            src={heroVideo}
                            muted
                            loop
                            autoPlay
                            playsInline
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <button
                            type="button"
                            onClick={() => setHeroVideo('')}
                            style={{
                              position: 'absolute', top: 4, right: 4,
                              width: 22, height: 22, borderRadius: '50%',
                              background: 'rgba(220,53,69,0.9)', border: '2px solid rgba(255,255,255,0.8)',
                              color: '#fff', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                            }}
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ) : (
                        <label style={{
                          width: 150, height: 100, borderRadius: 10,
                          border: '2px dashed var(--border-light)',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          gap: '0.25rem', cursor: 'pointer',
                          color: 'var(--text-muted)', fontSize: '0.6rem',
                          transition: 'border-color 0.2s, background 0.2s',
                          background: 'var(--bg-warm)',
                        }}>
                          <Upload size={16} />
                          <span style={{ fontWeight: 500 }}>{tr.chooseVideo}</span>
                          <input
                            type="file"
                            accept="video/mp4,video/webm"
                            style={{ display: 'none' }}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const sb = createClient();
                              const ext = file.name.split('.').pop() || 'mp4';
                              const path = `hero-video/${crypto.randomUUID()}.${ext}`;
                              const { error } = await sb.storage
                                .from('event-media')
                                .upload(path, file, { cacheControl: '31536000', upsert: false });
                              if (error) {
                                console.error('Upload error:', error);
                                // Fallback to object URL if storage fails
                                const objectUrl = URL.createObjectURL(file);
                                setHeroVideo(objectUrl);
                              } else {
                                const { data: urlData } = sb.storage
                                  .from('event-media')
                                  .getPublicUrl(path);
                                setHeroVideo(urlData.publicUrl);
                              }
                              e.target.value = '';
                            }}
                          />
                        </label>
                      )}
                    </div>

                    {/* Restore default video button */}
                    {heroVideo !== '/default_video.mp4' && (
                      <button
                        type="button"
                        onClick={() => setHeroVideo('/default_video.mp4')}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                          fontSize: '0.7rem', fontWeight: 600,
                          padding: '0.4rem 0.75rem', borderRadius: 8,
                          background: 'rgba(200,169,110,0.08)', border: '1px solid rgba(200,169,110,0.2)',
                          color: 'var(--gold)', cursor: 'pointer',
                          marginBottom: '0.6rem',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <RotateCcw size={12} />
                        {tr.restoreDefaultVideo}
                      </button>
                    )}

                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                      {heroVideo
                        ? tr.videoPlaying
                        : tr.noVideoSelected
                      }
                    </p>
                  </SectionCard>
                )}

                {/* Colors */}
                <SectionCard title={tr.themeColors} icon={Palette}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">{tr.primaryColor}</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: 12,
                          background: primaryColor,
                          border: '2px solid var(--border-light)',
                          cursor: 'pointer', position: 'relative', overflow: 'hidden', flexShrink: 0,
                        }}>
                          <input
                            type="color" value={primaryColor}
                            onChange={e => setPrimaryColor(e.target.value)}
                            style={{ position: 'absolute', inset: -5, width: '150%', height: '150%', cursor: 'pointer', opacity: 0 }}
                          />
                        </div>
                        <input className="input" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} style={{ flex: 1 }} />
                      </div>
                    </div>
                    <div>
                      <label className="label">{tr.secondaryColor}</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: 12,
                          background: secondaryColor,
                          border: '2px solid var(--border-light)',
                          cursor: 'pointer', position: 'relative', overflow: 'hidden', flexShrink: 0,
                        }}>
                          <input
                            type="color" value={secondaryColor}
                            onChange={e => setSecondaryColor(e.target.value)}
                            style={{ position: 'absolute', inset: -5, width: '150%', height: '150%', cursor: 'pointer', opacity: 0 }}
                          />
                        </div>
                        <input className="input" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} style={{ flex: 1 }} />
                      </div>
                    </div>
                  </div>
                  {/* Color preview */}
                  <div style={{
                    marginTop: '1rem', height: 48, borderRadius: 12,
                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#FFFFFF', fontSize: '0.8rem', fontWeight: 600,
                    textShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }}>
                    {tr.themePreview}
                  </div>
                </SectionCard>
              </motion.div>
              );
            })()}

            {/* ── Step 5: Programme ───────── */}
            {step === 5 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <SectionCard title={tr.dayProgram} icon={Clock}>
                  {/* Venues banner / chips */}
                  {allAvailableVenues.length === 0 ? (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1rem',
                      background: 'rgba(200,169,110,0.06)', border: '1px dashed var(--gold)',
                      borderRadius: '0.75rem', marginBottom: '0.85rem',
                    }}>
                      <MapPin size={16} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', flex: 1 }}>
                        {tr.noVenuesHint}
                      </span>
                      <button
                        type="button"
                        onClick={() => { setVenueModalTargetItemId(null); setShowVenueModal(true); }}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                          fontSize: '0.75rem', fontWeight: 600, padding: '0.35rem 0.75rem', borderRadius: 8,
                          background: 'linear-gradient(135deg, var(--gold), var(--gold-light))',
                          color: '#fff', flexShrink: 0, border: 'none', cursor: 'pointer',
                        }}
                      >
                        <Plus size={12} /> {tr.addVenues}
                      </button>
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      marginBottom: '0.85rem', flexWrap: 'wrap',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flex: 1, flexWrap: 'wrap' }}>
                        {allAvailableVenues.map(v => (
                          <span key={v.id} style={{
                            fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: 6,
                            background: 'rgba(200,169,110,0.08)', border: '1px solid rgba(200,169,110,0.15)',
                            color: 'var(--text)',
                          }}>{v.emoji || '📍'} {v.name}</span>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => { setVenueModalTargetItemId(null); setShowVenueModal(true); }}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                          fontSize: '0.7rem', fontWeight: 600, padding: '0.25rem 0.6rem', borderRadius: 6,
                          background: 'rgba(200,169,110,0.1)', color: 'var(--gold)',
                          border: '1px solid rgba(200,169,110,0.2)', cursor: 'pointer',
                        }}
                      >
                        <Plus size={11} /> {tr.addMore}
                      </button>
                    </div>
                  )}

                  {/* Venue creation modal with map */}
                  {showVenueModal && (
                    <VenueFormModal
                      onSave={handleAddVenue}
                      onClose={() => { setShowVenueModal(false); setVenueModalTargetItemId(null); }}
                    />
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {program.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                          padding: '1rem',
                          background: 'var(--glass)', border: '1px solid var(--glass-border)',
                          borderRadius: '0.85rem', flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ position: 'relative', width: 48 }}>
                          <button
                            type="button"
                            onClick={() => setEmojiPickerOpen(emojiPickerOpen === item.id ? null : item.id)}
                            style={{
                              width: 48, height: 48, borderRadius: 12,
                              fontSize: '1.35rem', cursor: 'pointer',
                              border: emojiPickerOpen === item.id ? '2px solid var(--gold)' : '1.5px solid var(--border-light)',
                              background: emojiPickerOpen === item.id ? 'rgba(200,169,110,0.1)' : 'var(--bg-warm)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            {item.icon}
                          </button>
                          {emojiPickerOpen === item.id && (
                            <div style={{
                              position: 'absolute', top: 54, left: 0, zIndex: 50,
                              background: 'var(--bg-card)', border: '1px solid var(--border-light)',
                              borderRadius: 14, padding: '0.6rem',
                              boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                              display: 'flex', flexWrap: 'wrap', gap: '0.3rem',
                              width: 220,
                            }}>
                              {emojiOptions.map(em => (
                                <button
                                  key={em} type="button"
                                  onClick={() => { updateProgramItem(item.id, { icon: em }); setEmojiPickerOpen(null); }}
                                  style={{
                                    width: 36, height: 36, borderRadius: 8, fontSize: '1.1rem',
                                    border: item.icon === em ? '2px solid var(--gold)' : '1px solid transparent',
                                    background: item.icon === em ? 'rgba(200,169,110,0.12)' : 'transparent',
                                    cursor: 'pointer', transition: 'all 0.15s',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  }}
                                >{em}</button>
                              ))}
                            </div>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <input className="input" type="time" value={item.time} onChange={e => updateProgramItem(item.id, { time: e.target.value })} />
                            <input className="input sm:col-span-2" placeholder={tr.stepTitle} value={item.title} onChange={e => updateProgramItem(item.id, { title: e.target.value })} />
                          </div>
                          <input className="input" placeholder={tr.stepDesc} value={item.description} onChange={e => updateProgramItem(item.id, { description: e.target.value })} />
                          {/* Venue selector — always visible with quick add option */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <MapPin size={14} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                            <select
                              className="input"
                              value={item.venueId || ''}
                              onChange={e => updateProgramItem(item.id, { venueId: e.target.value || undefined })}
                              style={{ flex: 1 }}
                            >
                              <option value="">{tr.noVenue}</option>
                              {allAvailableVenues.map(v => (
                                <option key={v.id} value={v.id}>{v.emoji || '📍'} {v.name}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => {
                                setVenueModalTargetItemId(item.id);
                                setShowVenueModal(true);
                              }}
                              title={tr.addVenues || 'Ajouter un lieu'}
                              style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem',
                                padding: '0.5rem 0.65rem', borderRadius: 8,
                                background: 'rgba(200,169,110,0.1)', color: 'var(--gold)',
                                border: '1px solid rgba(200,169,110,0.25)', cursor: 'pointer',
                                fontSize: '0.75rem', flexShrink: 0,
                              }}
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                        </div>
                        {program.length > 1 && (
                          <button
                            onClick={() => removeProgramItem(item.id)}
                            style={{
                              background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)',
                              borderRadius: 8, padding: '0.4rem', cursor: 'pointer', marginTop: '0.2rem',
                            }}
                          >
                            <Trash2 size={14} style={{ color: '#F87171' }} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={addProgramItem}
                    style={{
                      width: '100%', marginTop: '0.75rem', padding: '0.75rem',
                      background: 'transparent', border: '2px dashed var(--border-light)',
                      borderRadius: '0.75rem', cursor: 'pointer', color: 'var(--text-muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                      fontSize: '0.85rem', fontWeight: 500, transition: 'all 0.2s ease',
                    }}
                  >
                    <Plus size={16} /> {tr.addStep}
                  </button>
                </SectionCard>
              </motion.div>
            )}

            {/* Navigation buttons */}
            <div className="new-event-nav" style={{
              display: 'flex', gap: '0.75rem', marginTop: '1.5rem',
              paddingBottom: '2rem',
            }}>
              {step > 1 && (
                <button className="btn-secondary" style={{ flex: 1, padding: '0.85rem' }} onClick={() => setStep(s => s - 1)}>
                  <ArrowLeft size={16} /> {tr.previous}
                </button>
              )}
              {step < totalSteps ? (
                <button className="btn-primary" style={{ flex: 1, padding: '0.85rem' }} onClick={() => setStep(s => s + 1)}>
                  {tr.next} <ArrowRight size={16} />
                </button>
              ) : (
                <button className="btn-primary" style={{ flex: 1, padding: '0.85rem' }} onClick={handleCreate} disabled={isCreatingEvent}>
                  <Sparkles size={16} /> {isCreatingEvent ? 'Création en cours...' : tr.create}
                </button>
              )}
            </div>
          </motion.div>
          )}
        </div>

        {/* Preview column — desktop only, visible after plan selected and during wizard steps */}
        {selectedPlan && (
          <div
            className="template-preview-sidebar"
            style={{
              width: 320,
              flexShrink: 0,
              position: 'sticky',
              top: '2rem',
              alignSelf: 'flex-start',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
              <Eye size={14} style={{ color: 'var(--gold)' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{tr.livePreview}</span>
            </div>
            <TemplatePreview
              templateId={selectedTemplateId}
              eventType={eventType}
              eventName={name}
              date={date}
              time={time}
              venue={venue}
              brideName={brideName}
              groomName={groomName}
              dressCode={dressCode}
              welcomeMessage={welcomeMessage}
              program={program}
              primaryColor={primaryColor}
              heroImages={heroImages}
              heroType={heroType}
              heroVideo={heroVideo}
            />
          </div>
        )}
        </div>

        {/* Mobile preview FAB + drawer */}
        {selectedPlan && (
          <>
            <button
              onClick={() => setShowMobilePreview(true)}
              className="mobile-preview-fab"
              style={{
                position: 'fixed', bottom: 100, right: 20, zIndex: 50,
                width: 48, height: 48, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--gold), #B8860B)',
                border: 'none', color: '#fff', cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(200,169,110,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Eye size={20} />
            </button>

            <AnimatePresence>
              {showMobilePreview && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowMobilePreview(false)}
                  style={{
                    position: 'fixed', inset: 0, zIndex: 100,
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{ position: 'relative' }}
                  >
                    <button
                      onClick={() => setShowMobilePreview(false)}
                      style={{
                        position: 'absolute', top: -16, right: -16, zIndex: 10,
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'var(--bg-card)', border: '1px solid var(--border-light)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: 'var(--text)',
                      }}
                    >
                      <X size={14} />
                    </button>
                    <TemplatePreview
                      templateId={selectedTemplateId}
                      eventType={eventType}
                      eventName={name}
                      date={date}
                      time={time}
                      venue={venue}
                      brideName={brideName}
                      groomName={groomName}
                      dressCode={dressCode}
                      welcomeMessage={welcomeMessage}
                      program={program}
                      primaryColor={primaryColor}
                      heroImages={heroImages}
                      heroType={heroType}
                      heroVideo={heroVideo}
                    />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <style>{`
              @media (min-width: 768px) {
                .mobile-preview-fab { display: none !important; }
              }
              @media (max-width: 767px) {
                .template-preview-sidebar { display: none !important; }
                .new-event-layout {
                  flex-direction: column !important;
                }
                .new-event-form {
                  max-width: 100% !important;
                  width: 100% !important;
                }
                .new-event-nav {
                  position: sticky;
                  bottom: 0;
                  z-index: 30;
                  background: var(--bg-sidebar);
                  backdrop-filter: blur(12px);
                  -webkit-backdrop-filter: blur(12px);
                  margin: 0 -0.85rem;
                  padding: 0.75rem 0.85rem !important;
                  padding-bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px)) !important;
                  border-top: 1px solid var(--border-light);
                  margin-top: 1rem !important;
                }
                .mobile-preview-fab {
                  bottom: calc(80px + env(safe-area-inset-bottom, 0px)) !important;
                }
              }
            `}</style>
          </>
        )}
      </main>
    </div>
  );
}
