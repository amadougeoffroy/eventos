'use client';
import Sidebar from '@/components/Sidebar';
import EventLoader from '@/components/EventLoader';
import { useApp } from '@/context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { eventTypeConfig, planConfig } from '@/lib/mock-data';
import { ProgramItem } from '@/lib/types';
import ConfirmModal from '@/components/ConfirmModal';
import { getTemplate, getTemplateVariant } from '@/lib/templates/template-registry';
import {
  CalendarDays, MapPin, Clock, Users, CheckCircle2, XCircle, HelpCircle,
  Send, UtensilsCrossed, LayoutGrid, Radio, ArrowRight, ExternalLink, Copy, TrendingUp,
  Plus, Edit3, Trash2, X, GripVertical, Image, Upload, MessageCircleHeart, LayoutTemplate, Music, Lock,
  Film, Images, CheckCircle, Play, Pause
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.45 }
  })
};

export default function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const { events, guests, venues, updateEvent, removeEvent, eventsLoading } = useApp();
  const event = events.find(e => e.id === eventId);
  const eventVenues = venues.filter(v => v.eventId === eventId);

  // Event edit/delete state
  const [showEditEvent, setShowEditEvent] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', date: '', time: '', venue: '', venueAddress: '', dressCode: '', welcomeMessage: '' });

  const openEditEvent = () => {
    if (!event) return;
    setEditForm({ name: event.name, date: event.date, time: event.time, venue: event.venue, venueAddress: event.venueAddress || '', dressCode: event.dressCode || '', welcomeMessage: event.welcomeMessage || '' });
    setShowEditEvent(true);
  };
  const saveEditEvent = () => {
    if (!editForm.name) return;
    updateEvent(eventId, { ...editForm, venueAddress: editForm.venueAddress || undefined, dressCode: editForm.dressCode || undefined, welcomeMessage: editForm.welcomeMessage || undefined });
    setShowEditEvent(false);
  };
  const [confirmDelete, setConfirmDelete] = useState(false);
  const handleDeleteEvent = () => {
    removeEvent(eventId);
    window.location.href = '/dashboard';
  };

  // Program CRUD state
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<ProgramItem | null>(null);
  const [progForm, setProgForm] = useState({ time: '', title: '', description: '', icon: '🎉', venueId: '' });

  const emojiOptions = ['🎉','💒','🍽️','💃','🎂','🎵','📸','🥂','💐','🎤','🚗','⛪','💍','🎊','🌙'];

  // ── Sweet messages from Supabase ──
  const [sweetMessages, setSweetMessages] = useState<{id: string; author_name: string; message: string; created_at: string}[]>([]);

  useEffect(() => {
    const loadSweetMessages = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data } = await supabase
          .from('sweet_messages')
          .select('*')
          .eq('event_id', eventId)
          .order('created_at', { ascending: false });
        if (data) setSweetMessages(data);
      } catch {}
    };
    loadSweetMessages();
  }, [eventId]);

  const [origin, setOrigin] = useState('');
  useEffect(() => { setOrigin(window.location.origin); }, []);

  const openAddProgram = () => {
    setEditingProgram(null);
    setProgForm({ time: '', title: '', description: '', icon: '🎉', venueId: '' });
    setShowProgramModal(true);
  };
  const openEditProgram = (p: ProgramItem) => {
    setEditingProgram(p);
    setProgForm({ time: p.time, title: p.title, description: p.description || '', icon: p.icon, venueId: p.venueId || '' });
    setShowProgramModal(true);
  };
  const handleSaveProgram = () => {
    if (!progForm.time || !progForm.title || !event) return;
    let newProgram = [...event.program];
    if (editingProgram) {
      newProgram = newProgram.map(p => p.id === editingProgram.id ? { ...p, ...progForm } : p);
    } else {
      newProgram.push({ id: `prog-${Date.now()}`, time: progForm.time, title: progForm.title, description: progForm.description, icon: progForm.icon, venueId: progForm.venueId || undefined });
    }
    newProgram.sort((a, b) => a.time.localeCompare(b.time));
    updateEvent(eventId, { program: newProgram });
    setShowProgramModal(false);
  };
  const handleDeleteProgram = (id: string) => {
    if (!event) return;
    updateEvent(eventId, { program: event.program.filter(p => p.id !== id) });
  };
  const eventGuests = useMemo(() => guests.filter(g => g.eventId === eventId), [guests, eventId]);

  if (!event) return eventsLoading ? <EventLoader /> : <div className="flex"><Sidebar /><main className="main-content"><p>Événement non trouvé</p></main></div>;

  const cfg = eventTypeConfig[event.type];
  const confirmed = eventGuests.filter(g => g.rsvpStatus === 'confirmed').length;
  const pending = eventGuests.filter(g => g.rsvpStatus === 'pending').length;
  const declined = eventGuests.filter(g => g.rsvpStatus === 'declined').length;
  const confirmRate = eventGuests.length > 0 ? Math.round((confirmed / eventGuests.length) * 100) : 0;
  const daysLeft = Math.ceil((new Date(event.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const quickActions = [
    { href: `/dashboard/events/${eventId}/guests`, icon: Users, label: 'Invités', desc: `${eventGuests.length} invités`, color: '#5B8DB8' },
    { href: `/dashboard/events/${eventId}/invitations`, icon: Send, label: 'Invitations', desc: 'Envoyer les liens', color: '#C8A96E' },
    { href: `/dashboard/events/${eventId}/menu`, icon: UtensilsCrossed, label: 'Menu', desc: 'Gérer le menu', color: '#FB923C' },
    { href: `/dashboard/events/${eventId}/tables`, icon: LayoutGrid, label: 'Plan de salle', desc: 'Placer les invités', color: '#A78BFA' },
    { href: `/dashboard/events/${eventId}/live`, icon: Radio, label: 'Jour J', desc: 'Service en direct', color: '#22964F' },
  ];

  const publicLink = `${origin}/e/${event.slug}`;

  const rsvpStats = [
    { label: 'Confirmés', value: confirmed, icon: CheckCircle2, color: '#22964F', bg: 'linear-gradient(135deg, rgba(34,150,79,0.12), rgba(34,150,79,0.04))' },
    { label: 'En attente', value: pending, icon: HelpCircle, color: '#DC8C28', bg: 'linear-gradient(135deg, rgba(220,140,40,0.12), rgba(220,140,40,0.04))' },
    { label: 'Déclinés', value: declined, icon: XCircle, color: '#DC3545', bg: 'linear-gradient(135deg, rgba(220,53,69,0.12), rgba(220,53,69,0.04))' },
  ];

  return (
    <div className="flex">
      <Sidebar eventId={eventId} />
      <main className="main-content">
        {/* ── Hero Card ───────────────────────────── */}
        <motion.div
          initial="hidden" animate="visible" variants={fadeUp} custom={0}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: '1.25rem',
            overflow: 'hidden',
            marginBottom: '1.5rem',
            position: 'relative',
          }}
        >
          {/* Gradient accent bar */}
          <div style={{ height: 5, background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}66, transparent)` }} />

          {/* Decorative glow */}
          <div style={{
            position: 'absolute', top: -60, right: -40,
            width: 200, height: 200, borderRadius: '50%',
            background: `radial-gradient(circle, ${cfg.color}10, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          <div style={{ padding: '1.75rem 2rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1.5rem' }}>
              <div>
                {/* Title row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.5rem' }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 16,
                    background: `${cfg.color}12`, border: `1px solid ${cfg.color}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.75rem',
                  }}>
                    {cfg.emoji}
                  </div>
                  <div>
                    <h1 className="font-display text-2xl font-bold" style={{ marginBottom: '0.2rem' }}>{event.name}</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '0.75rem', fontWeight: 600,
                        padding: '0.2rem 0.65rem', borderRadius: 6,
                        background: `${cfg.color}15`, color: cfg.color,
                        letterSpacing: '0.03em',
                      }}>
                        {cfg.label}
                      </span>
                      {event.plan && planConfig[event.plan] && (
                        <span style={{
                          fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: 6,
                          background: `${planConfig[event.plan].color}15`, color: planConfig[event.plan].color,
                          border: `1px solid ${planConfig[event.plan].color}30`,
                          letterSpacing: '0.04em', textTransform: 'uppercase',
                        }}>{planConfig[event.plan].icon} {planConfig[event.plan].label}</span>
                      )}
                      <button onClick={openEditEvent} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                        fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: 6,
                        background: 'rgba(200,169,110,0.1)', color: 'var(--gold)', border: 'none', cursor: 'pointer',
                      }}><Edit3 size={11} /> Modifier</button>
                      <button onClick={() => setConfirmDelete(true)} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                        fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: 6,
                        background: 'rgba(220,53,69,0.08)', color: '#DC3545', border: 'none', cursor: 'pointer',
                      }}><Trash2 size={11} /> Supprimer</button>
                    </div>
                  </div>
                </div>

                {/* Metadata chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '0.85rem' }}>
                  {[
                    { icon: CalendarDays, text: new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) },
                    { icon: Clock, text: event.time },
                    { icon: MapPin, text: event.venue },
                  ].map((m, idx) => {
                    const MIcon = m.icon;
                    return (
                      <span key={idx} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                        fontSize: '0.8rem', color: 'var(--text-muted)',
                        padding: '0.35rem 0.7rem', borderRadius: 8,
                        background: 'var(--glass)', border: '1px solid var(--glass-border)',
                      }}>
                        <MIcon size={13} /> {m.text}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Countdown */}
              <div style={{ textAlign: 'center', padding: '0.5rem 1.25rem' }}>
                <div style={{
                  fontSize: '2.75rem', fontWeight: 800, lineHeight: 1,
                  background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}AA)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  J-{daysLeft > 0 ? daysLeft : 0}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem', letterSpacing: '0.05em' }}>
                  avant le jour J
                </div>
              </div>
            </div>

            {/* Public link */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              marginTop: '1.25rem', padding: '0.6rem 0.85rem',
              background: 'var(--glass)', border: '1px solid var(--glass-border)',
              borderRadius: 12, flexWrap: 'wrap', overflow: 'hidden',
            }}>
              <ExternalLink size={14} style={{ color: 'var(--gold)', flexShrink: 0 }} />
              <span className="text-sm truncate" style={{ color: 'var(--gold-light)', flex: 1 }}>{publicLink}</span>
              <button
                className="btn-ghost"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', borderRadius: 8 }}
                onClick={() => navigator.clipboard.writeText(publicLink)}
              >
                <Copy size={14} /> Copier
              </button>
              <Link href={`/e/${event.slug}`} className="btn-ghost" target="_blank" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', borderRadius: 8 }}>
                <ExternalLink size={14} /> Ouvrir
              </Link>
            </div>
          </div>
        </motion.div>

        {/* ── RSVP Summary ────────────────────────── */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {rsvpStats.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                initial="hidden" animate="visible" variants={fadeUp} custom={i + 2}
                style={{
                  background: s.bg,
                  border: `1px solid ${s.color}20`,
                  borderRadius: '1rem',
                  padding: '1.25rem 1.5rem',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{
                  position: 'absolute', top: -15, right: -15,
                  width: 60, height: 60, borderRadius: '50%',
                  background: `${s.color}08`, border: `1px solid ${s.color}10`,
                }} />
                <Icon size={20} color={s.color} style={{ marginBottom: '0.65rem' }} />
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: '0.2rem' }}>
                  {s.value}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Confirmation rate bar */}
        <motion.div
          initial="hidden" animate="visible" variants={fadeUp} custom={5}
          style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-light)',
            borderRadius: '1rem', padding: '1rem 1.5rem', marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span className="text-sm" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <TrendingUp size={14} /> Taux de confirmation global
            </span>
            <span className="text-sm font-bold" style={{ color: '#22964F' }}>{confirmRate}%</span>
          </div>
          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${confirmRate}%` }}
              transition={{ duration: 1.2, delay: 0.6, ease: 'easeOut' }}
            />
          </div>
        </motion.div>

        {/* ── Quick Actions ────────────────────────── */}
        <h2 className="font-display text-lg font-semibold mb-4">Actions rapides</h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
          {quickActions.map((a, i) => {
            const Icon = a.icon;
            return (
              <motion.div key={a.label} initial="hidden" animate="visible" variants={fadeUp} custom={i + 6}>
                <Link href={a.href} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                  <div
                    className="card-hover"
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-light)',
                      borderRadius: '1rem',
                      padding: '1.5rem 1rem',
                      textAlign: 'center',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{
                      position: 'absolute', bottom: -10, right: -10,
                      width: 50, height: 50, borderRadius: '50%',
                      background: `${a.color}06`,
                    }} />
                    <div style={{
                      width: 48, height: 48, borderRadius: 14,
                      background: `${a.color}12`, border: `1px solid ${a.color}20`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 0.75rem',
                    }}>
                      <Icon size={22} color={a.color} />
                    </div>
                    <div className="font-medium text-sm" style={{ marginBottom: '0.15rem' }}>{a.label}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{a.desc}</div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* ── Template actif ─────────────────────── */}
        {(() => {
          const tpl = getTemplate(event.templateId || 'classique');
          const variant = getTemplateVariant(event.templateId || 'classique', event.type);
          if (!tpl) return null;
          return (
            <motion.div
              initial="hidden" animate="visible" variants={fadeUp} custom={7}
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-light)',
                borderRadius: '1rem', padding: '1.25rem 1.5rem', marginBottom: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                  background: variant ? `linear-gradient(135deg, ${variant.palette.primary}, ${variant.palette.accent})` : 'var(--glass)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <LayoutTemplate size={22} style={{ color: '#fff' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="font-semibold">{tpl.name}</span>
                    <span style={{
                      fontSize: '0.55rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: 5,
                      background: tpl.plan === 'premium' ? 'rgba(168,85,247,0.1)' : tpl.plan === 'pro' ? 'rgba(59,130,246,0.1)' : 'rgba(200,169,110,0.1)',
                      color: tpl.plan === 'premium' ? '#A855F7' : tpl.plan === 'pro' ? '#3B82F6' : '#C8A96E',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>{tpl.plan}</span>
                    <Lock size={12} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{tpl.description}</div>
                </div>
                {variant && (
                  <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
                    {[variant.palette.primary, variant.palette.accent, variant.palette.secondary].map((c, i) => (
                      <div key={i} style={{ width: 20, height: 20, borderRadius: '50%', background: c, border: '2px solid var(--bg-card)', boxShadow: '0 0 0 1px var(--border-light)' }} />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })()}

        {/* ── Média de l'invitation ───────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Image size={18} style={{ color: 'var(--gold)' }} />
            <h2 className="font-display text-lg font-semibold" style={{ margin: 0 }}>Média</h2>
          </div>
        </div>
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={8}
          className="card" style={{ marginBottom: '2rem' }}
        >
          {/* ── Hero Type Selector ── */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
              <Image size={14} style={{ color: 'var(--gold)' }} />
              <span className="text-sm font-semibold">Type de Hero</span>
            </div>

            {(() => {
              const plan = event.plan || 'essentiel';
              const heroType = event.heroType || 'image';
              const heroOptions: { key: 'image' | 'slideshow' | 'video'; label: string; icon: React.ReactNode; desc: string; minPlan: string }[] = [
                { key: 'image', label: 'Image fixe', icon: <Image size={18} />, desc: '1 image principale', minPlan: 'essentiel' },
                { key: 'slideshow', label: 'Diaporama', icon: <Images size={18} />, desc: 'Jusqu\'à ' + (plan === 'premium' ? 10 : 5) + ' images', minPlan: 'pro' },
                { key: 'video', label: 'Vidéo', icon: <Film size={18} />, desc: 'Vidéo de fond', minPlan: 'premium' },
              ];
              const planOrder = { essentiel: 0, pro: 1, premium: 2 };
              const userPlanLevel = planOrder[plan as keyof typeof planOrder] ?? 0;

              return (
                <>
                  {/* Type cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem', marginBottom: '1.25rem' }}>
                    {heroOptions.map(opt => {
                      const optPlanLevel = planOrder[opt.minPlan as keyof typeof planOrder] ?? 0;
                      const locked = userPlanLevel < optPlanLevel;
                      const active = heroType === opt.key;
                      return (
                        <button key={opt.key} onClick={() => {
                          if (locked) return;
                          updateEvent(eventId, {
                            heroType: opt.key,
                            ...(opt.key === 'image' ? { heroImages: (event.heroImages || []).slice(0, 1) } : {}),
                          });
                        }} style={{
                          position: 'relative', padding: '1rem 0.5rem', borderRadius: 14, border: active
                            ? '2px solid var(--gold)' : '1.5px solid var(--border-light)',
                          background: active ? 'rgba(200,169,110,0.08)' : 'transparent',
                          cursor: locked ? 'not-allowed' : 'pointer', textAlign: 'center',
                          opacity: locked ? 0.45 : 1, transition: 'all 0.2s',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
                        }}>
                          <div style={{ color: active ? 'var(--gold)' : 'var(--text-muted)' }}>{opt.icon}</div>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}>{opt.label}</span>
                          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{opt.desc}</span>
                          {locked && (
                            <span style={{
                              position: 'absolute', top: 6, right: 6,
                              display: 'inline-flex', alignItems: 'center', gap: '0.15rem',
                              fontSize: '0.55rem', padding: '0.1rem 0.35rem', borderRadius: 5,
                              background: 'rgba(168,85,247,0.08)', color: '#A855F7', fontWeight: 600,
                            }}><Lock size={8} />{opt.minPlan === 'pro' ? 'Pro' : 'Premium'}</span>
                          )}
                          {active && (
                            <div style={{ position: 'absolute', top: 6, left: 6 }}>
                              <CheckCircle size={14} style={{ color: 'var(--gold)' }} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Upload area based on selected type */}
                  {heroType === 'image' && (
                    <div>
                      <input type="file" id="hero-file-input" accept="image/*" style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file || !event) return;
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const dataUrl = ev.target?.result as string;
                            if (dataUrl) updateEvent(eventId, { heroImages: [dataUrl] });
                          };
                          reader.readAsDataURL(file);
                          e.target.value = '';
                        }}
                      />
                      {event.heroImages && event.heroImages.length > 0 ? (
                        <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-light)', aspectRatio: '16/9', maxWidth: 320 }}>
                          <img src={event.heroImages[0]} alt="Hero" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button onClick={() => updateEvent(eventId, { heroImages: [] })} style={{
                            position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%',
                            background: 'rgba(220,50,50,0.85)', border: 'none', color: '#fff', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}><X size={13} /></button>
                        </div>
                      ) : (
                        <button onClick={() => document.getElementById('hero-file-input')?.click()} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                          width: '100%', padding: '2rem', borderRadius: 12, border: '2px dashed var(--border-light)',
                          background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.82rem',
                        }}><Upload size={18} /> Charger une image</button>
                      )}
                    </div>
                  )}

                  {heroType === 'slideshow' && (
                    <div>
                      <input type="file" id="hero-file-input" accept="image/*" multiple style={{ display: 'none' }}
                        onChange={(e) => {
                          const files = e.target.files;
                          if (!files || !event) return;
                          const maxImg = plan === 'premium' ? 10 : 5;
                          const current = event.heroImages || [];
                          if (current.length >= maxImg) return;
                          Array.from(files).slice(0, maxImg - current.length).forEach(file => {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              const dataUrl = ev.target?.result as string;
                              if (dataUrl) updateEvent(eventId, { heroImages: [...(event.heroImages || []), dataUrl] });
                            };
                            reader.readAsDataURL(file);
                          });
                          e.target.value = '';
                        }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
                        <button onClick={() => document.getElementById('hero-file-input')?.click()} style={{
                          display: 'flex', alignItems: 'center', gap: '0.35rem',
                          padding: '0.5rem 0.85rem', borderRadius: 10, border: '1.5px dashed var(--gold)',
                          background: 'rgba(200,169,110,0.06)', cursor: 'pointer',
                          color: 'var(--gold)', fontWeight: 600, fontSize: '0.78rem',
                        }}><Upload size={15} /> Ajouter des photos</button>
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                          {(event.heroImages || []).length} / {plan === 'premium' ? 10 : 5}
                        </span>
                      </div>
                      {(event.heroImages && event.heroImages.length > 0) ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem' }}>
                          {event.heroImages.map((url, idx) => (
                            <div key={idx} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border-light)', aspectRatio: '16/10' }}>
                              <img src={url} alt={`Slide ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <div style={{
                                position: 'absolute', top: 4, left: 4, width: 18, height: 18, borderRadius: '50%',
                                background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '0.55rem', fontWeight: 700,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>{idx + 1}</div>
                              <button onClick={() => {
                                const next = [...(event.heroImages || [])]; next.splice(idx, 1);
                                updateEvent(eventId, { heroImages: next });
                              }} style={{
                                position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%',
                                background: 'rgba(220,50,50,0.85)', border: 'none', color: '#fff', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}><X size={11} /></button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          <Images size={28} style={{ margin: '0 auto 0.4rem', opacity: 0.3 }} />
                          <p style={{ margin: 0 }}>Ajoutez des images pour le diaporama</p>
                        </div>
                      )}
                    </div>
                  )}

                  {heroType === 'video' && (
                    <div>
                      <input type="file" id="hero-video-input" accept="video/mp4,video/webm,video/ogg" style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const dataUrl = ev.target?.result as string;
                            if (dataUrl) updateEvent(eventId, { heroVideo: dataUrl });
                          };
                          reader.readAsDataURL(file);
                          e.target.value = '';
                        }}
                      />
                      {event.heroVideo ? (
                        <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-light)', maxWidth: 200, aspectRatio: '16/9' }}>
                          <video src={event.heroVideo} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} muted />
                          <button onClick={() => updateEvent(eventId, { heroVideo: undefined })} style={{
                            position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%',
                            background: 'rgba(220,50,50,0.85)', border: 'none', color: '#fff', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}><X size={11} /></button>
                          <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0.3rem 0.5rem',
                            background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
                            display: 'flex', alignItems: 'center', gap: '0.3rem',
                          }}>
                            <Film size={12} style={{ color: '#fff' }} />
                            <span style={{ fontSize: '0.6rem', color: '#fff', fontWeight: 600 }}>Vidéo chargée</span>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => document.getElementById('hero-video-input')?.click()} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                          width: '100%', padding: '2rem', borderRadius: 12, border: '2px dashed var(--border-light)',
                          background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.82rem',
                        }}><Film size={18} /> Charger une vidéo (MP4, WebM)</button>
                      )}
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* Background Music — Pro + Premium */}
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
              <Music size={14} style={{ color: 'var(--gold)' }} />
              <span className="text-sm font-semibold">Musique d&apos;ambiance</span>
              {event.plan === 'essentiel' && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.2rem', marginLeft: '0.5rem',
                  fontSize: '0.6rem', padding: '0.1rem 0.4rem', borderRadius: 5,
                  background: 'rgba(168,85,247,0.08)', color: '#A855F7', fontWeight: 600,
                }}>
                  <Lock size={9} /> Pro
                </span>
              )}
            </div>
            {(event.plan === 'pro' || event.plan === 'premium') ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="file" id="music-file-input"
                  accept=".mp3,.m4a,.ogg,.wav,.aac,audio/mpeg,audio/mp4,audio/ogg,audio/wav,audio/aac"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const dataUrl = ev.target?.result as string;
                      if (dataUrl) updateEvent(eventId, { backgroundMusicUrl: dataUrl });
                    };
                    reader.readAsDataURL(file);
                    e.target.value = '';
                  }}
                />
                {event.backgroundMusicUrl ? (
                  <>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1,
                      padding: '0.5rem 0.75rem', borderRadius: 10,
                      background: 'rgba(200,169,110,0.06)', border: '1px solid var(--border-light)',
                    }}>
                      <Music size={14} style={{ color: 'var(--gold)' }} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text)' }}>🎵 Musique chargée</span>
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>Lecture auto sur l&apos;invitation</span>
                    </div>
                    <button onClick={() => updateEvent(eventId, { backgroundMusicUrl: '' })} style={{
                      padding: '0.4rem', borderRadius: 8, background: 'rgba(220,53,69,0.08)',
                      border: '1px solid rgba(220,53,69,0.2)', cursor: 'pointer', color: '#DC3545',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}><Trash2 size={14} /></button>
                  </>
                ) : (
                  <button onClick={() => document.getElementById('music-file-input')?.click()} style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem', width: '100%',
                    padding: '0.75rem', borderRadius: 10, border: '1.5px dashed var(--border-light)',
                    background: 'transparent', cursor: 'pointer',
                    color: 'var(--text-muted)', fontSize: '0.8rem',
                  }}>
                    <Upload size={16} /> Charger un fichier audio (.mp3, .m4a, .ogg)
                  </button>
                )}
              </div>
            ) : (
              <div style={{
                padding: '0.75rem 1rem', borderRadius: 10,
                background: 'var(--glass)', border: '1px solid var(--glass-border)',
                color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center',
              }}>
                🔒 La musique d&apos;ambiance est disponible à partir de la formule Pro
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Programme ─────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 className="font-display text-lg font-semibold" style={{ margin: 0 }}>Programme</h2>
          <button onClick={openAddProgram} style={{
            display: 'flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.45rem 0.85rem', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, var(--gold), var(--gold-light))',
            color: '#fff', fontWeight: 600, fontSize: '0.78rem',
          }}><Plus size={14} /> Ajouter</button>
        </div>
        <motion.div
          initial="hidden" animate="visible" variants={fadeUp} custom={11}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '1.25rem', overflow: 'hidden' }}
        >
          {event.program.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
              <Clock size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.3 }} />
              <p style={{ fontSize: '0.85rem', margin: 0 }}>Aucun élément dans le programme</p>
              <p style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>Cliquez sur « Ajouter » pour commencer</p>
            </div>
          )}
          {event.program.map((p, i) => (
            <div
              key={p.id}
              style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '1rem 1.5rem',
                borderBottom: i < event.program.length - 1 ? '1px solid var(--border)' : 'none',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--glass)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{
                fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold-light)',
                width: 52, textAlign: 'center', flexShrink: 0,
                padding: '0.3rem 0', borderRadius: 8,
                background: 'rgba(200,169,110,0.08)',
              }}>{p.time}</div>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'var(--glass)', border: '1px solid var(--glass-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.15rem', flexShrink: 0,
              }}>{p.icon}</div>
              <div style={{ flex: 1 }}>
                <div className="font-medium" style={{ fontSize: '0.95rem' }}>{p.title}</div>
                {p.description && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{p.description}</div>}
                {p.venueId && (() => {
                  const v = venues.find(x => x.id === p.venueId);
                  return v ? (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem', fontSize: '0.65rem', padding: '0.15rem 0.45rem', borderRadius: 6, background: 'rgba(200,169,110,0.08)', color: 'var(--gold)' }}>
                      <MapPin size={9} /> {v.name}
                    </div>
                  ) : null;
                })()}
              </div>
              <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                <button onClick={() => openEditProgram(p)} title="Modifier" style={{
                  background: 'none', border: 'none', padding: 5, borderRadius: 6,
                  cursor: 'pointer', color: 'var(--text-muted)', transition: 'color 0.2s',
                }} onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
                   onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                  <Edit3 size={14} />
                </button>
                <button onClick={() => handleDeleteProgram(p.id)} title="Supprimer" style={{
                  background: 'none', border: 'none', padding: 5, borderRadius: 6,
                  cursor: 'pointer', color: 'var(--text-muted)', transition: 'color 0.2s',
                }} onMouseEnter={e => e.currentTarget.style.color = '#F87171'}
                   onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </motion.div>

        {/* ── Program Add/Edit Modal ──────────── */}
        <AnimatePresence>
          {showProgramModal && (
            <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowProgramModal(false)}>
              <motion.div className="modal" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <h2 className="font-display" style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                    {editingProgram ? 'Modifier l\'élément' : 'Ajouter au programme'}
                  </h2>
                  <button onClick={() => setShowProgramModal(false)} style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <X size={16} />
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.65rem' }}>
                    <div>
                      <label className="label">Heure *</label>
                      <input className="input" type="time" value={progForm.time} onChange={e => setProgForm(p => ({ ...p, time: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">Titre *</label>
                      <input className="input" placeholder="Cérémonie religieuse" value={progForm.title} onChange={e => setProgForm(p => ({ ...p, title: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="label">Description</label>
                    <input className="input" placeholder="Optionnel" value={progForm.description} onChange={e => setProgForm(p => ({ ...p, description: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Icône</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {emojiOptions.map(em => (
                        <button key={em} type="button" onClick={() => setProgForm(p => ({ ...p, icon: em }))} style={{
                          width: 38, height: 38, borderRadius: 10, fontSize: '1.1rem',
                          border: progForm.icon === em ? '2px solid var(--gold)' : '1px solid var(--border-light)',
                          background: progForm.icon === em ? 'rgba(200,169,110,0.1)' : 'var(--glass)',
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}>{em}</button>
                      ))}
                    </div>
                  </div>
                  {eventVenues.length > 0 && (
                    <div>
                      <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <MapPin size={13} style={{ color: 'var(--gold)' }} />
                        Lieu
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        <button type="button" onClick={() => setProgForm(p => ({ ...p, venueId: '' }))} style={{
                          padding: '0.4rem 0.7rem', borderRadius: 8, fontSize: '0.75rem',
                          border: !progForm.venueId ? '1.5px solid var(--gold)' : '1px solid var(--border-light)',
                          background: !progForm.venueId ? 'rgba(200,169,110,0.1)' : 'var(--glass)',
                          color: !progForm.venueId ? 'var(--gold)' : 'var(--text-muted)',
                          cursor: 'pointer', fontWeight: !progForm.venueId ? 600 : 400,
                        }}>Aucun</button>
                        {eventVenues.map(v => {
                          const sel = progForm.venueId === v.id;
                          return (
                            <button key={v.id} type="button" onClick={() => setProgForm(p => ({ ...p, venueId: v.id }))} style={{
                              display: 'flex', alignItems: 'center', gap: '0.3rem',
                              padding: '0.4rem 0.7rem', borderRadius: 8, fontSize: '0.75rem',
                              border: sel ? '1.5px solid var(--gold)' : '1px solid var(--border-light)',
                              background: sel ? 'rgba(200,169,110,0.1)' : 'var(--glass)',
                              color: sel ? 'var(--gold)' : 'var(--text-muted)',
                              cursor: 'pointer', fontWeight: sel ? 600 : 400,
                            }}>
                              <span>{v.emoji || '📍'}</span> {v.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button onClick={() => setShowProgramModal(false)} style={{ flex: 1, padding: '0.6rem', borderRadius: 10, border: '1px solid var(--border-light)', background: 'var(--glass)', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>Annuler</button>
                    <button onClick={handleSaveProgram} disabled={!progForm.time || !progForm.title} style={{
                      flex: 1, padding: '0.6rem', borderRadius: 10, border: 'none',
                      background: (!progForm.time || !progForm.title) ? 'var(--glass)' : 'linear-gradient(135deg, var(--gold), var(--gold-light))',
                      color: (!progForm.time || !progForm.title) ? 'var(--text-muted)' : '#fff',
                      fontWeight: 600, fontSize: '0.8rem', cursor: (!progForm.time || !progForm.title) ? 'not-allowed' : 'pointer',
                    }}>{editingProgram ? 'Enregistrer' : 'Ajouter'}</button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Petits mots doux ─────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <MessageCircleHeart size={18} style={{ color: 'var(--gold)' }} />
          <h2 className="font-display text-lg font-semibold" style={{ margin: 0 }}>Petits mots doux</h2>
          {sweetMessages.length > 0 && (
            <span style={{
              fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem',
              borderRadius: 20, background: 'rgba(200,169,110,0.12)', color: 'var(--gold)',
            }}>{sweetMessages.length}</span>
          )}
        </div>
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={14}
          className="card" style={{ marginBottom: '2rem' }}
        >
          {sweetMessages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💌</div>
              <p className="font-medium" style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>Aucun message pour le moment</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Les invités pourront laisser un petit mot depuis le lien d&apos;invitation</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {sweetMessages.map(msg => (
                <div key={msg.id} style={{
                  padding: '0.85rem 1rem', borderRadius: 12,
                  background: 'rgba(200,169,110,0.04)', border: '1px solid var(--border-light)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 8,
                        background: 'linear-gradient(135deg, rgba(200,169,110,0.15), rgba(200,169,110,0.05))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.7rem', fontWeight: 700, color: 'var(--gold)',
                      }}>{msg.author_name.charAt(0).toUpperCase()}</div>
                      <span className="font-semibold" style={{ fontSize: '0.8rem' }}>{msg.author_name}</span>
                    </div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                      {new Date(msg.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{msg.message}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
        {/* ── Edit Event Modal ─────────────────── */}
        <AnimatePresence>
          {showEditEvent && (
            <motion.div
              className="modal-overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', padding: '1rem' }}
              onClick={() => setShowEditEvent(false)}
            >
              <motion.div
                className="modal"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                style={{ background: 'var(--bg-card)', borderRadius: '1.25rem', padding: '1.75rem', maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-lg)' }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <h2 className="font-display text-lg font-bold">Modifier l&apos;événement</h2>
                  <button onClick={() => setShowEditEvent(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div><label className="label">Nom</label><input className="input" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div><label className="label">Date</label><input className="input" type="date" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} /></div>
                    <div><label className="label">Heure</label><input className="input" type="time" value={editForm.time} onChange={e => setEditForm({...editForm, time: e.target.value})} /></div>
                  </div>
                  <div><label className="label">Lieu principal</label><input className="input" value={editForm.venue} onChange={e => setEditForm({...editForm, venue: e.target.value})} /></div>
                  <div><label className="label">Adresse</label><input className="input" value={editForm.venueAddress} onChange={e => setEditForm({...editForm, venueAddress: e.target.value})} /></div>
                  <div><label className="label">Dress code</label><input className="input" placeholder="ex: Tenue traditionnelle" value={editForm.dressCode} onChange={e => setEditForm({...editForm, dressCode: e.target.value})} /></div>
                  <div><label className="label">Message de bienvenue</label><textarea className="input" rows={3} value={editForm.welcomeMessage} onChange={e => setEditForm({...editForm, welcomeMessage: e.target.value})} style={{ resize: 'vertical' }} /></div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowEditEvent(false)} style={{ padding: '0.55rem 1rem', borderRadius: 10, border: '1px solid var(--border-light)', background: 'transparent', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>Annuler</button>
                  <button onClick={saveEditEvent} disabled={!editForm.name} style={{ padding: '0.55rem 1rem', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', color: '#fff', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>Enregistrer</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Delete confirmation modal */}
      <ConfirmModal
        open={confirmDelete}
        title="Supprimer l'événement"
        message={`Êtes-vous sûr de vouloir supprimer "${event?.name}" ? Cette action est irréversible et toutes les données associées seront perdues.`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
        onConfirm={handleDeleteEvent}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
