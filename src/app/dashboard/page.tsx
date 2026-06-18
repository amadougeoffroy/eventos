'use client';
import Sidebar from '@/components/Sidebar';
import { useApp } from '@/context/AppContext';
import { useThemeLanguage } from '@/context/ThemeLanguageContext';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useMemo } from 'react';
import {
  Plus, Users, CheckCircle2, Clock, XCircle, ArrowRight,
  CalendarDays, MapPin, TrendingUp, Lightbulb, Sparkles, Activity, Image
} from 'lucide-react';
import { eventTypeConfig, planConfig } from '@/lib/mock-data';
import RsvpDonutChart from '@/components/RsvpDonutChart';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5 }
  })
};

export default function DashboardPage() {
  const { events, guests } = useApp();
  const { t, lang } = useThemeLanguage();
  const tr = t('dashboard');

  const totalGuests = guests.length;
  const confirmed = guests.filter(g => g.rsvpStatus === 'confirmed').length;
  const pending = guests.filter(g => g.rsvpStatus === 'pending').length;
  const declined = guests.filter(g => g.rsvpStatus === 'declined').length;

  // Next upcoming event
  const nextEvent = useMemo(() => {
    const now = Date.now();
    return events
      .filter(e => new Date(e.date).getTime() > now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] || null;
  }, [events]);

  const nextEventDaysLeft = nextEvent
    ? Math.ceil((new Date(nextEvent.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;
  const nextEventCfg = nextEvent ? eventTypeConfig[nextEvent.type] : null;
  const nextEventGuests = nextEvent ? guests.filter(g => g.eventId === nextEvent.id) : [];
  const nextEventConfirmed = nextEventGuests.filter(g => g.rsvpStatus === 'confirmed').length;
  const nextEventRate = nextEventGuests.length > 0
    ? Math.round((nextEventConfirmed / nextEventGuests.length) * 100)
    : 0;

  // Activity feed — recent RSVP changes
  const recentActivity = useMemo(() => {
    return guests
      .filter(g => g.rsvpStatus !== 'pending')
      .sort((a, b) => {
        const da = a.respondedAt || '';
        const db = b.respondedAt || '';
        return db.localeCompare(da);
      })
      .slice(0, 6)
      .map(g => {
        const evt = events.find(e => e.id === g.eventId);
        return { ...g, eventName: evt?.name || '' };
      });
  }, [guests, events]);

  // Contextual tips
  const tips = useMemo(() => {
    const tipList: { text: string; icon: string; link?: string; linkLabel?: string }[] = [];
    if (events.length === 0) {
      tipList.push({ text: tr.tipCreate, icon: '🎉', link: '/dashboard/events/new', linkLabel: tr.tipCreateBtn });
    }
    if (nextEvent && nextEventDaysLeft <= 21 && nextEventDaysLeft > 0) {
      tipList.push({ text: tr.tipDDay.replace('{n}', String(nextEventDaysLeft)).replace('{name}', nextEvent.name), icon: '⏰' });
    }
    if (pending > totalGuests * 0.5 && totalGuests > 0) {
      tipList.push({ text: tr.tipPending.replace('{n}', String(pending)).replace('{pct}', String(Math.round((pending / totalGuests) * 100))), icon: '📩' });
    }
    const eventsWithoutImages = events.filter(e => !e.heroImages || e.heroImages.length === 0);
    if (eventsWithoutImages.length > 0) {
      tipList.push({ text: tr.tipPhotos, icon: '📷', link: eventsWithoutImages[0] ? `/dashboard/events/${eventsWithoutImages[0].id}` : undefined, linkLabel: tr.tipPhotosBtn });
    }
    return tipList.slice(0, 2);
  }, [events, nextEvent, nextEventDaysLeft, pending, totalGuests]);

  const stats = [
    { label: tr.events, value: events.length, icon: CalendarDays, color: '#C8A96E' },
    { label: tr.totalGuests, value: totalGuests, icon: Users, color: '#5B8DB8' },
    { label: tr.confirmed, value: confirmed, icon: CheckCircle2, color: '#22964F' },
    { label: tr.pending, value: pending, icon: Clock, color: '#DC8C28' },
  ];

  function timeAgo(dateStr?: string) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return tr.agoMin.replace('{n}', String(mins));
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return tr.agoH.replace('{n}', String(hrs));
    const days = Math.floor(hrs / 24);
    return tr.agoD.replace('{n}', String(days));
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="main-content">
        {/* Header */}
        <div className="dash-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <motion.h1
              className="font-display text-3xl font-bold mb-1"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            >
              {tr.welcome}, <span className="gradient-gold">Amadou</span> 👋
            </motion.h1>
            <p style={{ color: 'var(--text-muted)' }}>{tr.subtitle}</p>
          </div>
          <Link href="/dashboard/events/new" className="btn-primary">
            <Plus size={18} /> {tr.newEventBtn}
          </Link>
        </div>

        {/* ── Stats + Donut ─────────────────────── */}
        <motion.div
          initial="hidden" animate="visible" variants={fadeUp} custom={0}
          className="dash-stats-donut"
          style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem',
            marginBottom: '1.5rem',
          }}
        >
          {/* Donut Chart */}
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-light)',
            borderRadius: '1.25rem', padding: '1.5rem',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem', alignSelf: 'flex-start' }}>
              <TrendingUp size={16} style={{ color: 'var(--gold)' }} />
              <span className="text-sm font-semibold">{tr.rsvpDistribution}</span>
            </div>
            <RsvpDonutChart confirmed={confirmed} pending={pending} declined={declined} />
          </div>

          {/* Stats grid */}
          <div className="dash-stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.label}
                  initial="hidden" animate="visible" variants={fadeUp} custom={i + 1}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '1rem',
                    padding: '1.25rem',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{
                    position: 'absolute', top: -15, right: -15,
                    width: 60, height: 60, borderRadius: '50%',
                    background: `${s.color}08`,
                  }} />
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `${s.color}12`, border: `1px solid ${s.color}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '0.75rem',
                  }}>
                    <Icon size={18} color={s.color} />
                  </div>
                  <div className="stat-value" style={{ fontSize: '1.75rem', fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: '0.15rem' }}>
                    {s.value}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Prochain événement ─────────────────── */}
        {nextEvent && nextEventCfg && (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={5}>
            <Link href={`/dashboard/events/${nextEvent.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <div
                className="card-hover"
                style={{
                  background: `linear-gradient(135deg, ${nextEventCfg.color}15, ${nextEventCfg.color}05)`,
                  border: `1px solid ${nextEventCfg.color}25`,
                  borderRadius: '1.25rem',
                  padding: '1.75rem 2rem',
                  marginBottom: '1.5rem',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                }}
              >
                {/* Decorative glow */}
                <div style={{
                  position: 'absolute', top: -40, right: -20,
                  width: 160, height: 160, borderRadius: '50%',
                  background: `radial-gradient(circle, ${nextEventCfg.color}10, transparent 70%)`,
                  pointerEvents: 'none',
                }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Sparkles size={14} style={{ color: nextEventCfg.color }} />
                  <span className="text-xs font-semibold" style={{ color: nextEventCfg.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {tr.nextEvent}
                  </span>
                </div>

                <div className="dash-next-event-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: `${nextEventCfg.color}15`, border: `1px solid ${nextEventCfg.color}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.3rem',
                      }}>{nextEventCfg.emoji}</div>
                      <div>
                        <h3 className="font-display font-bold" style={{ fontSize: '1.15rem', marginBottom: '0.1rem' }}>{nextEvent.name}</h3>
                        <div className="text-xs" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <CalendarDays size={11} />
                            {new Date(nextEvent.date).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                          {nextEvent.venue && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                              <MapPin size={11} /> {nextEvent.venue}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Mini progress bar */}
                    <div className="dash-next-event-progress" style={{ maxWidth: 300 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{tr.confirmations}</span>
                        <span className="text-xs font-bold" style={{ color: '#22964F' }}>{nextEventRate}%</span>
                      </div>
                      <div className="progress-bar" style={{ height: 6 }}>
                        <motion.div
                          className="progress-fill"
                          initial={{ width: 0 }}
                          animate={{ width: `${nextEventRate}%` }}
                          transition={{ duration: 1.2, delay: 0.5 }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Big countdown */}
                  <div className="dash-next-event-countdown" style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{
                      fontSize: '2.5rem', fontWeight: 800, lineHeight: 1,
                      color: nextEventCfg.color,
                    }}>{tr.dDay}{nextEventDaysLeft > 0 ? nextEventDaysLeft : 0}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {nextEventGuests.length} {nextEventGuests.length !== 1 ? tr.guests : tr.guest}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* ── Activité récente + Tips ───────────── */}
        <div className="dash-activity-tips" style={{ display: 'grid', gridTemplateColumns: recentActivity.length > 0 ? '1fr 1fr' : '1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Activity feed */}
          {recentActivity.length > 0 && (
            <motion.div
              initial="hidden" animate="visible" variants={fadeUp} custom={6}
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-light)',
                borderRadius: '1.25rem', padding: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Activity size={16} style={{ color: 'var(--gold)' }} />
                <span className="text-sm font-semibold">{tr.recentActivity}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {recentActivity.map((g, i) => (
                  <motion.div
                    key={g.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.08 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.6rem',
                      padding: '0.5rem 0.6rem', borderRadius: 10,
                      background: 'var(--glass)', transition: 'background 0.2s',
                    }}
                  >
                    {/* Avatar initials */}
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      background: g.rsvpStatus === 'confirmed' ? 'rgba(34,150,79,0.1)' : 'rgba(220,53,69,0.1)',
                      border: `1px solid ${g.rsvpStatus === 'confirmed' ? 'rgba(34,150,79,0.2)' : 'rgba(220,53,69,0.2)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.65rem', fontWeight: 700,
                      color: g.rsvpStatus === 'confirmed' ? '#22964F' : '#DC3545',
                    }}>
                      {g.firstName?.[0]}{g.lastName?.[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="text-xs font-medium" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {g.firstName} {g.lastName}
                      </div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {g.eventName}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '0.6rem', fontWeight: 600, padding: '0.15rem 0.4rem', borderRadius: 6,
                      background: g.rsvpStatus === 'confirmed' ? 'rgba(34,150,79,0.08)' : 'rgba(220,53,69,0.08)',
                      color: g.rsvpStatus === 'confirmed' ? '#22964F' : '#DC3545',
                      whiteSpace: 'nowrap',
                    }}>
                      {g.rsvpStatus === 'confirmed' ? tr.confirmedStatus : tr.declinedStatus}
                    </div>
                    <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {timeAgo(g.respondedAt)}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Tips */}
          {tips.length > 0 && (
            <motion.div
              initial="hidden" animate="visible" variants={fadeUp} custom={7}
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-light)',
                borderRadius: '1.25rem', padding: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Lightbulb size={16} style={{ color: 'var(--gold)' }} />
                <span className="text-sm font-semibold">{tr.tips}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {tips.map((tip, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
                    padding: '0.75rem', borderRadius: 12,
                    background: 'rgba(200,169,110,0.04)', border: '1px solid rgba(200,169,110,0.1)',
                  }}>
                    <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{tip.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p className="text-xs" style={{ color: 'var(--text)', margin: 0, lineHeight: 1.5 }}>{tip.text}</p>
                      {tip.link && (
                        <Link href={tip.link} className="text-xs font-semibold" style={{ color: 'var(--gold)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.3rem' }}>
                          {tip.linkLabel} <ArrowRight size={10} />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* ── Mes événements ─────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 className="font-display text-xl font-semibold">{tr.manage}</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {events.map((evt, i) => {
            const cfg = eventTypeConfig[evt.type];
            const evtGuests = guests.filter(g => g.eventId === evt.id);
            const evtConfirmed = evtGuests.filter(g => g.rsvpStatus === 'confirmed').length;
            const evtPending = evtGuests.filter(g => g.rsvpStatus === 'pending').length;
            const evtDeclined = evtGuests.filter(g => g.rsvpStatus === 'declined').length;
            const confirmRate = evtGuests.length > 0 ? Math.round((evtConfirmed / evtGuests.length) * 100) : 0;
            const daysLeft = Math.ceil((new Date(evt.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

            return (
              <motion.div
                key={evt.id}
                initial="hidden" animate="visible"
                variants={fadeUp} custom={i + 8}
              >
                <Link href={`/dashboard/events/${evt.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                  <div
                    className="card-hover"
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-light)',
                      borderRadius: '1.25rem',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                  >
                    {/* Gradient top bar */}
                    <div style={{
                      height: 4,
                      background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}66, transparent)`,
                    }} />

                    <div className="dash-event-card-padding" style={{ padding: '1.5rem' }}>
                      {/* Event header */}
                      <div className="dash-event-card-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: 48, height: 48, borderRadius: 14,
                            background: `${cfg.color}12`, border: `1px solid ${cfg.color}25`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.5rem',
                          }}>{cfg.emoji}</div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                              <h3 className="font-semibold" style={{ fontSize: '1.1rem' }}>{evt.name}</h3>
                              {evt.plan && planConfig[evt.plan] && (
                                <span style={{
                                  fontSize: '0.55rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: 6,
                                  background: `${planConfig[evt.plan].color}15`, color: planConfig[evt.plan].color,
                                  border: `1px solid ${planConfig[evt.plan].color}30`,
                                  textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0,
                                }}>{planConfig[evt.plan].label}</span>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <CalendarDays size={12} />
                                {new Date(evt.date).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                              {evt.venue && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <MapPin size={12} /> {evt.venue}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Countdown badge */}
                        <div style={{
                          background: daysLeft > 30 ? 'rgba(200,169,110,0.1)' : daysLeft > 7 ? 'rgba(220,140,40,0.1)' : 'rgba(220,53,69,0.1)',
                          color: daysLeft > 30 ? '#C8A96E' : daysLeft > 7 ? '#DC8C28' : '#DC3545',
                          border: `1px solid ${daysLeft > 30 ? 'rgba(200,169,110,0.2)' : daysLeft > 7 ? 'rgba(220,140,40,0.2)' : 'rgba(220,53,69,0.2)'}`,
                          borderRadius: 10,
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                        }}>
                          {tr.dDay}{daysLeft > 0 ? daysLeft : 0}
                        </div>
                      </div>

                      {/* Confirmation progress */}
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span className="text-xs" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <TrendingUp size={12} /> {tr.confirmationRate}
                          </span>
                          <span className="text-xs font-bold" style={{ color: '#22964F' }}>{confirmRate}%</span>
                        </div>
                        <div className="progress-bar">
                          <motion.div
                            className="progress-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${confirmRate}%` }}
                            transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                          />
                        </div>
                      </div>

                      {/* RSVP mini-stats row */}
                      <div className="dash-event-rsvp-row" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                        {[
                          { label: tr.confirmed, value: evtConfirmed, color: '#22964F', bg: 'rgba(34,150,79,0.06)' },
                          { label: tr.pending, value: evtPending, color: '#DC8C28', bg: 'rgba(220,140,40,0.06)' },
                          { label: tr.declined, value: evtDeclined, color: '#DC3545', bg: 'rgba(220,53,69,0.06)' },
                        ].map(stat => (
                          <div key={stat.label} style={{
                            flex: 1, background: stat.bg, borderRadius: 10,
                            padding: '0.6rem 0.75rem', textAlign: 'center',
                          }}>
                            <div className="rsvp-value" style={{ fontSize: '1.1rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                            <div className="rsvp-label" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{stat.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* CTA */}
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                        padding: '0.6rem', borderRadius: 10,
                        background: 'rgba(200,169,110,0.06)', border: '1px solid rgba(200,169,110,0.12)',
                        color: 'var(--gold)', fontSize: '0.85rem', fontWeight: 600,
                      }}>
                        {tr.manageEvent} <ArrowRight size={14} />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}

          {/* Create new event card */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={events.length + 8}>
            <Link href="/dashboard/events/new" style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
              <div
                className="card-hover dash-create-card"
                style={{
                  background: 'var(--bg-card)',
                  border: '2px dashed var(--border-light)',
                  borderRadius: '1.25rem',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '3rem 2rem',
                  cursor: 'pointer', minHeight: 280, height: '100%', textAlign: 'center',
                }}
              >
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(200,169,110,0.12), rgba(200,169,110,0.04))',
                  border: '2px dashed rgba(200,169,110,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '1rem',
                }}>
                  <Plus size={28} style={{ color: 'var(--gold)' }} />
                </div>
                <div className="font-semibold" style={{ fontSize: '1.05rem', marginBottom: '0.35rem' }}>{tr.createEvent}</div>
                <div className="text-sm" style={{ color: 'var(--text-muted)', maxWidth: 200 }}>{tr.eventTypesHint}</div>
              </div>
            </Link>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
