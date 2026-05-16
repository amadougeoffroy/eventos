'use client';
import Sidebar from '@/components/Sidebar';
import { useApp } from '@/context/AppContext';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Plus, Users, CheckCircle2, Clock, XCircle, ArrowRight, CalendarDays, MapPin, TrendingUp } from 'lucide-react';
import { eventTypeConfig, planConfig } from '@/lib/mock-data';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5 }
  })
};

export default function DashboardPage() {
  const { events, guests } = useApp();

  const totalGuests = guests.length;
  const confirmed = guests.filter(g => g.rsvpStatus === 'confirmed').length;
  const pending = guests.filter(g => g.rsvpStatus === 'pending').length;
  const declined = guests.filter(g => g.rsvpStatus === 'declined').length;

  const stats = [
    { label: 'Événements', value: events.length, icon: CalendarDays, color: '#C8A96E', bg: 'linear-gradient(135deg, rgba(200,169,110,0.12), rgba(200,169,110,0.04))' },
    { label: 'Invités total', value: totalGuests, icon: Users, color: '#5B8DB8', bg: 'linear-gradient(135deg, rgba(91,141,184,0.12), rgba(91,141,184,0.04))' },
    { label: 'Confirmés', value: confirmed, icon: CheckCircle2, color: '#22964F', bg: 'linear-gradient(135deg, rgba(34,150,79,0.12), rgba(34,150,79,0.04))' },
    { label: 'En attente', value: pending, icon: Clock, color: '#DC8C28', bg: 'linear-gradient(135deg, rgba(220,140,40,0.12), rgba(220,140,40,0.04))' },
  ];

  return (
    <div className="flex">
      <Sidebar />
      <main className="main-content">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <motion.h1
              className="font-display text-3xl font-bold mb-1"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            >
              Bienvenue, <span className="gradient-gold">Amadou</span> 👋
            </motion.h1>
            <p style={{ color: 'var(--text-muted)' }}>Voici un aperçu de vos événements</p>
          </div>
          <Link href="/dashboard/events/new" className="btn-primary">
            <Plus size={18} /> Nouvel événement
          </Link>
        </div>

        {/* Stats — premium cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                initial="hidden" animate="visible"
                variants={fadeUp} custom={i}
                style={{
                  background: s.bg,
                  border: `1px solid ${s.color}20`,
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Decorative circle */}
                <div style={{
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: `${s.color}08`,
                  border: `1px solid ${s.color}10`,
                }} />
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: `${s.color}15`,
                  border: `1px solid ${s.color}25`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}>
                  <Icon size={20} color={s.color} />
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: '0.25rem' }}>
                  {s.value}
                </div>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Events list */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 className="font-display text-xl font-semibold">Mes Événements</h2>
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
                variants={fadeUp} custom={i + 4}
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

                    <div style={{ padding: '1.5rem' }}>
                      {/* Event header */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: 48,
                            height: 48,
                            borderRadius: 14,
                            background: `${cfg.color}12`,
                            border: `1px solid ${cfg.color}25`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem',
                          }}>
                            {cfg.emoji}
                          </div>
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
                                {new Date(evt.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                              {evt.venue && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <MapPin size={12} />
                                  {evt.venue}
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
                          J-{daysLeft > 0 ? daysLeft : 0}
                        </div>
                      </div>

                      {/* Confirmation progress */}
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span className="text-xs" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <TrendingUp size={12} /> Taux de confirmation
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
                      <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        marginBottom: '1.25rem',
                      }}>
                        {[
                          { label: 'Confirmés', value: evtConfirmed, color: '#22964F', bg: 'rgba(34,150,79,0.06)' },
                          { label: 'En attente', value: evtPending, color: '#DC8C28', bg: 'rgba(220,140,40,0.06)' },
                          { label: 'Déclinés', value: evtDeclined, color: '#DC3545', bg: 'rgba(220,53,69,0.06)' },
                        ].map(stat => (
                          <div
                            key={stat.label}
                            style={{
                              flex: 1,
                              background: stat.bg,
                              borderRadius: 10,
                              padding: '0.6rem 0.75rem',
                              textAlign: 'center',
                            }}
                          >
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{stat.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* CTA */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        padding: '0.6rem',
                        borderRadius: 10,
                        background: 'rgba(200,169,110,0.06)',
                        border: '1px solid rgba(200,169,110,0.12)',
                        color: 'var(--gold)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        transition: 'all 0.2s ease',
                      }}>
                        Gérer l&apos;événement <ArrowRight size={14} />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}

          {/* Create new event card */}
          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} custom={events.length + 4}
          >
            <Link href="/dashboard/events/new" style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
              <div
                className="card-hover"
                style={{
                  background: 'var(--bg-card)',
                  border: '2px dashed var(--border-light)',
                  borderRadius: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '3rem 2rem',
                  cursor: 'pointer',
                  minHeight: 280,
                  height: '100%',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(200,169,110,0.12), rgba(200,169,110,0.04))',
                  border: '2px dashed rgba(200,169,110,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}>
                  <Plus size={28} style={{ color: 'var(--gold)' }} />
                </div>
                <div className="font-semibold" style={{ fontSize: '1.05rem', marginBottom: '0.35rem' }}>Créer un événement</div>
                <div className="text-sm" style={{ color: 'var(--text-muted)', maxWidth: 200 }}>Mariage, anniversaire, baptême, gala...</div>
              </div>
            </Link>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
