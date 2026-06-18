'use client';
import Sidebar from '@/components/Sidebar';
import EventLoader from '@/components/EventLoader';
import { useApp } from '@/context/AppContext';
import { useThemeLanguage } from '@/context/ThemeLanguageContext';
import { motion } from 'framer-motion';
import { use, useMemo } from 'react';
import {
  BarChart3, Users, UtensilsCrossed, TrendingUp, PieChart,
  Calendar, Clock, Gift, Heart, Table2, MessageCircle, Zap,
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.45 } })
};

export default function StatsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const { events, guests, menuItems, menuCategories, tables, gifts, eventsLoading } = useApp();
  const { t, lang } = useThemeLanguage();
  const tr = t('stats');
  const tc = t('common');
  const event = events.find(e => e.id === eventId);
  const eventGuests = useMemo(() => guests.filter(g => g.eventId === eventId), [guests, eventId]);
  const evtItems = useMemo(() => menuItems.filter(i => i.eventId === eventId), [menuItems, eventId]);
  const evtCategories = useMemo(() => menuCategories.filter(c => c.eventId === eventId), [menuCategories, eventId]);
  const evtTables = useMemo(() => tables.filter(t => t.eventId === eventId), [tables, eventId]);
  const evtGifts = useMemo(() => gifts.filter(g => g.eventId === eventId), [gifts, eventId]);



  // ─── RSVP Stats ───
  const total = eventGuests.length;
  const confirmed = eventGuests.filter(g => g.rsvpStatus === 'confirmed').length;
  const declined = eventGuests.filter(g => g.rsvpStatus === 'declined').length;
  const pending = eventGuests.filter(g => g.rsvpStatus === 'pending').length;
  const maybe = eventGuests.filter(g => g.rsvpStatus === 'maybe').length;
  const responded = confirmed + declined + maybe;
  const totalCompanions = eventGuests.reduce((s, g) => s + g.companions, 0);
  const totalWithCompanions = total + totalCompanions;
  const confirmedCompanions = eventGuests.filter(g => g.rsvpStatus === 'confirmed').reduce((s, g) => s + g.companions, 0);
  const confirmedWithCompanions = confirmed + confirmedCompanions;

  // ─── Countdown ───
  const eventDate = new Date(event?.date || '');
  const now = new Date();
  const diffMs = eventDate.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const isPast = daysLeft < 0;

  // ─── Groups ───
  const groups = useMemo(() => {
    const map = new Map<string, { total: number; confirmed: number }>();
    eventGuests.forEach(g => {
      const cur = map.get(g.group) || { total: 0, confirmed: 0 };
      cur.total++;
      if (g.rsvpStatus === 'confirmed') cur.confirmed++;
      map.set(g.group, cur);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].total - a[1].total);
  }, [eventGuests]);

  // ─── Dietary ───
  const diets = useMemo(() => {
    const map = new Map<string, number>();
    eventGuests.forEach(g => {
      if (g.allergies) map.set(g.allergies, (map.get(g.allergies) || 0) + 1);
      g.dietaryRestrictions?.forEach(r => map.set(r, (map.get(r) || 0) + 1));
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [eventGuests]);

  // ─── Menu / Survey ───
  const topItems = evtItems.filter(i => (i.votes || 0) > 0).sort((a, b) => (b.votes || 0) - (a.votes || 0)).slice(0, 5);
  const totalVotes = evtItems.reduce((s, i) => s + (i.votes || 0), 0);
  const surveyParticipants = evtCategories.length > 0 ? Math.round(totalVotes / evtCategories.length) : 0;
  const surveyRate = confirmed > 0 ? Math.round((surveyParticipants / confirmed) * 100) : 0;

  // Best dish per category
  const bestPerCategory = useMemo(() => {
    return evtCategories.map(cat => {
      const items = evtItems.filter(i => i.categoryId === cat.id && (i.votes || 0) > 0);
      if (items.length === 0) return null;
      const best = items.sort((a, b) => (b.votes || 0) - (a.votes || 0))[0];
      return { category: cat, item: best };
    }).filter(Boolean) as { category: typeof evtCategories[0]; item: typeof evtItems[0] }[];
  }, [evtCategories, evtItems]);

  // ─── Tables ───
  const totalSeats = evtTables.reduce((s, t) => s + t.capacity, 0);
  const assignedGuests = evtTables.reduce((s, t) => s + t.guestIds.length, 0);
  const fullTables = evtTables.filter(t => t.guestIds.length >= t.capacity).length;
  const emptyTables = evtTables.filter(t => t.guestIds.length === 0).length;
  const tableOccupancy = totalSeats > 0 ? Math.round((assignedGuests / totalSeats) * 100) : 0;

  // ─── Gifts ───
  const totalGifts = evtGifts.length;
  const reservedGifts = evtGifts.filter(g => g.reserved).length;
  const giftRate = totalGifts > 0 ? Math.round((reservedGifts / totalGifts) * 100) : 0;
  const totalGiftValue = evtGifts.reduce((s, g) => s + (g.price || 0), 0);
  const reservedGiftValue = evtGifts.filter(g => g.reserved).reduce((s, g) => s + (g.price || 0), 0);

  // ─── Engagement ───
  const privateMessages = eventGuests.filter(g => g.privateMessage && g.privateMessage.trim().length > 0).length;
  const guestsWithAllergies = eventGuests.filter(g => (g.allergies && g.allergies.trim()) || (g.dietaryRestrictions && g.dietaryRestrictions.length > 0)).length;
  const brideGuests = eventGuests.filter(g => g.side === 'bride').length;
  const groomGuests = eventGuests.filter(g => g.side === 'groom').length;
  const bothGuests = eventGuests.filter(g => g.side === 'both').length;
  const noSideGuests = eventGuests.filter(g => !g.side).length;
  const avgResponseTime = useMemo(() => {
    const withResponse = eventGuests.filter(g => g.respondedAt && g.rsvpStatus !== 'pending');
    if (withResponse.length === 0) return null;
    // We can't compute actual response time without createdAt, just show total responded
    return withResponse.length;
  }, [eventGuests]);

  // ─── RSVP Timeline ───
  const timeline = useMemo(() => {
    const responded = eventGuests.filter(g => g.respondedAt && g.rsvpStatus !== 'pending');
    if (responded.length === 0) return [];
    const map = new Map<string, { confirmed: number; declined: number; maybe: number }>();
    responded.forEach(g => {
      const d = new Date(g.respondedAt!).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
      const cur = map.get(d) || { confirmed: 0, declined: 0, maybe: 0 };
      if (g.rsvpStatus === 'confirmed') cur.confirmed++;
      else if (g.rsvpStatus === 'declined') cur.declined++;
      else if (g.rsvpStatus === 'maybe') cur.maybe++;
      map.set(d, cur);
    });
    return Array.from(map.entries()).map(([date, counts]) => ({ date, ...counts, total: counts.confirmed + counts.declined + counts.maybe }));
  }, [eventGuests]);

  // ─── RSVP bars data ───
  const rsvpData = [
    { label: tr.confirmed, value: confirmed, pct: total > 0 ? Math.round((confirmed / total) * 100) : 0, color: '#22964F' },
    { label: tr.pending, value: pending, pct: total > 0 ? Math.round((pending / total) * 100) : 0, color: '#DC8C28' },
    { label: tr.declined, value: declined, pct: total > 0 ? Math.round((declined / total) * 100) : 0, color: '#DC3545' },
    { label: 'Peut-être', value: maybe, pct: total > 0 ? Math.round((maybe / total) * 100) : 0, color: '#A78BFA' },
  ];

  // ─── Companions breakdown ───
  const companionsByStatus = useMemo(() => [
    { label: 'Confirmés', count: confirmedCompanions, color: '#22964F' },
    { label: 'En attente', count: eventGuests.filter(g => g.rsvpStatus === 'pending').reduce((s, g) => s + g.companions, 0), color: '#DC8C28' },
    { label: 'Peut-être', count: eventGuests.filter(g => g.rsvpStatus === 'maybe').reduce((s, g) => s + g.companions, 0), color: '#A78BFA' },
  ].filter(c => c.count > 0), [eventGuests, confirmedCompanions]);

  if (!event) return eventsLoading ? <EventLoader /> : <div className="flex"><Sidebar /><main className="main-content"><p>{tc.eventNotFound}</p></main></div>;

  /* Section wrapper */
  const SectionCard = ({ children, title, icon: IconComp, iconColor, delay }: { children: React.ReactNode; title: string; icon: React.ElementType; iconColor: string; delay: number }) => (
    <motion.div
      initial="hidden" animate="visible" variants={fadeUp} custom={delay}
      style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-light)',
        borderRadius: '1.25rem', padding: '1.5rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `${iconColor}12`, border: `1px solid ${iconColor}25`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <IconComp size={18} color={iconColor} />
        </div>
        <h3 className="font-semibold" style={{ fontSize: '1rem' }}>{title}</h3>
      </div>
      {children}
    </motion.div>
  );

  // ─── Mini stat badge ───
  const MiniBadge = ({ label, value, color }: { label: string; value: string | number; color: string }) => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0.6rem 0.85rem', borderRadius: 12,
      background: 'var(--glass)', border: '1px solid var(--glass-border)',
    }}>
      <span className="text-sm">{label}</span>
      <span style={{
        fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.55rem', borderRadius: 6,
        background: `${color}15`, color,
      }}>{value}</span>
    </div>
  );

  return (
    <div className="flex">
      <Sidebar eventId={eventId} />
      <main className="main-content">
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 className="font-display text-2xl font-bold" style={{ marginBottom: '0.15rem' }}>{tr.title}</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{event.name}</p>
        </div>

        {/* ════════ KPI Row ════════ */}
        <div className="stats-kpi grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            {
              label: isPast ? tr.finished : tr.countdown,
              value: isPast ? 'Passé' : daysLeft === 0 ? "Aujourd'hui !" : `${daysLeft}`,
              sub: isPast ? `depuis ${Math.abs(daysLeft)} jours` : daysLeft === 0 ? '' : daysLeft === 1 ? 'jour restant' : 'jours restants',
              icon: Calendar, color: isPast ? '#DC3545' : daysLeft <= 7 ? '#FB923C' : '#5B8DB8',
              bg: isPast ? 'linear-gradient(135deg, rgba(220,53,69,0.12), rgba(220,53,69,0.04))'
                : daysLeft <= 7 ? 'linear-gradient(135deg, rgba(251,146,60,0.12), rgba(251,146,60,0.04))'
                : 'linear-gradient(135deg, rgba(91,141,184,0.12), rgba(91,141,184,0.04))',
            },
            { label: tr.totalGuests, value: total, sub: `${totalWithCompanions} avec accomp.`, icon: Users, color: '#5B8DB8', bg: 'linear-gradient(135deg, rgba(91,141,184,0.12), rgba(91,141,184,0.04))' },
            { label: tr.confirmed, value: confirmed, sub: `${confirmedWithCompanions} personnes`, icon: TrendingUp, color: '#22964F', bg: 'linear-gradient(135deg, rgba(34,150,79,0.12), rgba(34,150,79,0.04))' },
            { label: 'Taux RSVP', value: `${total > 0 ? Math.round((responded / total) * 100) : 0}%`, sub: `${responded}/${total} ont répondu`, icon: PieChart, color: '#C8A96E', bg: 'linear-gradient(135deg, rgba(200,169,110,0.12), rgba(200,169,110,0.04))' },
            { label: 'Plats menu', value: evtItems.length, sub: `${evtCategories.length} catégories`, icon: UtensilsCrossed, color: '#FB923C', bg: 'linear-gradient(135deg, rgba(251,146,60,0.12), rgba(251,146,60,0.04))' },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label} initial="hidden" animate="visible" variants={fadeUp} custom={i}
                style={{ background: s.bg, border: `1px solid ${s.color}20`, borderRadius: '1rem', padding: '1.25rem', position: 'relative', overflow: 'hidden' }}
              >
                <div style={{ position: 'absolute', top: -15, right: -15, width: 50, height: 50, borderRadius: '50%', background: `${s.color}08` }} />
                <Icon size={18} color={s.color} style={{ marginBottom: '0.5rem' }} />
                <div style={{ fontSize: '1.65rem', fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: '0.15rem' }}>{s.value}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                <div className="text-xs" style={{ color: `${s.color}88`, marginTop: '0.15rem' }}>{s.sub}</div>
              </motion.div>
            );
          })}
        </div>

        <div className="stats-grid grid md:grid-cols-2 gap-5">
          {/* ════════ RSVP Breakdown ════════ */}
          <SectionCard title={tr.guestsByStatus} icon={BarChart3} iconColor="#C8A96E" delay={5}>
            <div className="space-y-4">
              {rsvpData.map(d => (
                <div key={d.label}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, display: 'inline-block' }} />
                      {d.label}
                    </span>
                    <span className="font-semibold">{d.value} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({d.pct}%)</span></span>
                  </div>
                  <div className="progress-bar">
                    <motion.div className="h-full rounded-full" style={{ background: d.color }} initial={{ width: 0 }} animate={{ width: `${d.pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
                  </div>
                </div>
              ))}
            </div>
            {/* Donut-style summary */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              marginTop: '1.25rem', padding: '0.75rem', borderRadius: 12,
              background: 'var(--glass)', border: '1px solid var(--glass-border)',
            }}>
              <div style={{
                width: 50, height: 50, borderRadius: '50%',
                background: `conic-gradient(#22964F ${confirmed / Math.max(total, 1) * 360}deg, #DC8C28 ${confirmed / Math.max(total, 1) * 360}deg ${(confirmed + pending) / Math.max(total, 1) * 360}deg, #DC3545 ${(confirmed + pending) / Math.max(total, 1) * 360}deg ${(confirmed + pending + declined) / Math.max(total, 1) * 360}deg, #A78BFA ${(confirmed + pending + declined) / Math.max(total, 1) * 360}deg)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--bg-card)' }} />
              </div>
              <div>
                <div className="text-xs font-semibold">{responded}/{total} réponses</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{pending} en attente</div>
              </div>
            </div>
          </SectionCard>

          {/* ════════ RSVP Timeline ════════ */}
          <SectionCard title={tr.responseTimeline} icon={Clock} iconColor="#5B8DB8" delay={6}>
            {timeline.length > 0 ? (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {timeline.map((day, i) => {
                    const maxDay = Math.max(...timeline.map(d => d.total));
                    const pct = maxDay > 0 ? (day.total / maxDay) * 100 : 0;
                    return (
                      <div key={day.date} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span className="text-xs" style={{ width: 55, textAlign: 'right', color: 'var(--text-muted)', flexShrink: 0 }}>{day.date}</span>
                        <div style={{ flex: 1, display: 'flex', height: 20, borderRadius: 6, overflow: 'hidden', background: 'var(--glass)' }}>
                          {day.confirmed > 0 && (
                            <motion.div
                              initial={{ width: 0 }} animate={{ width: `${(day.confirmed / day.total) * pct}%` }}
                              transition={{ duration: 0.6, delay: 0.05 * i }}
                              style={{ background: '#22964F', height: '100%' }}
                            />
                          )}
                          {day.declined > 0 && (
                            <motion.div
                              initial={{ width: 0 }} animate={{ width: `${(day.declined / day.total) * pct}%` }}
                              transition={{ duration: 0.6, delay: 0.05 * i }}
                              style={{ background: '#DC3545', height: '100%' }}
                            />
                          )}
                          {day.maybe > 0 && (
                            <motion.div
                              initial={{ width: 0 }} animate={{ width: `${(day.maybe / day.total) * pct}%` }}
                              transition={{ duration: 0.6, delay: 0.05 * i }}
                              style={{ background: '#A78BFA', height: '100%' }}
                            />
                          )}
                        </div>
                        <span className="text-xs font-semibold" style={{ width: 20, textAlign: 'right', color: 'var(--gold-light)' }}>{day.total}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.85rem', justifyContent: 'center' }}>
                  {[{ label: 'Confirmé', color: '#22964F' }, { label: 'Décliné', color: '#DC3545' }, { label: 'Peut-être', color: '#A78BFA' }].map(l => (
                    <span key={l.label} className="text-xs" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)' }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: l.color, display: 'inline-block' }} />
                      {l.label}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm" style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                Aucune réponse enregistrée pour le moment
              </p>
            )}
          </SectionCard>

          {/* ════════ Groups ════════ */}
          <SectionCard title={tr.guestsByGroup} icon={Users} iconColor="#5B8DB8" delay={7}>
            <div className="space-y-3">
              {groups.map(([name, data]) => {
                const pct = total > 0 ? Math.round((data.total / total) * 100) : 0;
                const confirmedPct = data.total > 0 ? Math.round((data.confirmed / data.total) * 100) : 0;
                return (
                  <div key={name}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                      <span>{name || tr.noGroup}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="text-xs" style={{ color: '#22964F' }}>{confirmedPct}% conf.</span>
                        <span className="font-semibold" style={{ color: 'var(--gold-light)' }}>{data.total}</span>
                      </div>
                    </div>
                    <div className="progress-bar">
                      <motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
                    </div>
                  </div>
                );
              })}
              {groups.length === 0 && <p className="text-sm" style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>Aucun groupe</p>}
            </div>
          </SectionCard>

          {/* ════════ Companions ════════ */}
          <SectionCard title="Accompagnants" icon={Heart} iconColor="#E879A0" delay={8}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '1rem', marginBottom: '1rem', borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(232,121,160,0.08), rgba(232,121,160,0.02))',
              border: '1px solid rgba(232,121,160,0.15)',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#E879A0', lineHeight: 1 }}>{totalCompanions}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>accompagnants déclarés</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {companionsByStatus.map(c => (
                <MiniBadge key={c.label} label={`${c.label}`} value={`${c.count} accomp.`} color={c.color} />
              ))}
              <MiniBadge label="Total personnes attendues" value={confirmedWithCompanions} color="#C8A96E" />
            </div>
          </SectionCard>

          {/* ════════ Tables & Logistique ════════ */}
          <SectionCard title="Tables & Logistique" icon={Table2} iconColor="#8B5CF6" delay={9}>
            {evtTables.length > 0 ? (
              <>
                {/* Occupancy gauge */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '1rem', marginBottom: '1rem', borderRadius: 14,
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(139,92,246,0.02))',
                  border: '1px solid rgba(139,92,246,0.15)',
                }}>
                  <div style={{ position: 'relative', width: 60, height: 60 }}>
                    <svg width="60" height="60" viewBox="0 0 60 60">
                      <circle cx="30" cy="30" r="25" fill="none" stroke="var(--glass-border)" strokeWidth="6" />
                      <motion.circle
                        cx="30" cy="30" r="25" fill="none" stroke="#8B5CF6" strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={`${(tableOccupancy / 100) * 157} 157`}
                        transform="rotate(-90 30 30)"
                        initial={{ strokeDasharray: '0 157' }}
                        animate={{ strokeDasharray: `${(tableOccupancy / 100) * 157} 157` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                      />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#8B5CF6' }}>
                      {tableOccupancy}%
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold" style={{ fontSize: '0.9rem' }}>Taux d&apos;occupation</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{assignedGuests}/{totalSeats} places assignées</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <MiniBadge label="Nombre de tables" value={evtTables.length} color="#8B5CF6" />
                  <MiniBadge label="Tables complètes" value={`${fullTables}/${evtTables.length}`} color="#22964F" />
                  <MiniBadge label="Tables vides" value={emptyTables} color="#DC8C28" />
                  <MiniBadge label="Places totales" value={totalSeats} color="#5B8DB8" />
                </div>
              </>
            ) : (
              <p className="text-sm" style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                Aucune table configurée
              </p>
            )}
          </SectionCard>

          {/* ════════ Survey / Menu ════════ */}
          <SectionCard title="Sondage menu" icon={BarChart3} iconColor="#FB923C" delay={10}>
            {evtItems.length > 0 ? (
              <>
                {/* Participation rate */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '0.85rem', marginBottom: '1rem', borderRadius: 12,
                  background: 'var(--glass)', border: '1px solid var(--glass-border)',
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1rem', fontWeight: 700, color: '#FB923C',
                  }}>{surveyRate}%</div>
                  <div>
                    <div className="text-sm font-medium">Taux de participation</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>~{surveyParticipants} votants sur {confirmed} confirmés</div>
                  </div>
                </div>

                {/* Best per category */}
                {bestPerCategory.length > 0 && (
                  <div>
                    <div className="text-xs font-medium" style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      🏆 Plat préféré par catégorie
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {bestPerCategory.map(({ category, item }) => (
                        <div key={category.id} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '0.55rem 0.85rem', borderRadius: 10,
                          background: 'var(--glass)', border: '1px solid var(--glass-border)',
                        }}>
                          <span className="text-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span>{category.icon}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{category.name}:</span>
                            <span className="font-medium">{item.name}</span>
                          </span>
                          <span style={{
                            fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.45rem', borderRadius: 5,
                            background: 'rgba(200,169,110,0.1)', color: 'var(--gold)',
                          }}>{item.votes} ✓</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top items */}
                {topItems.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <div className="text-xs font-medium" style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Top 5 des plats
                    </div>
                    <div className="space-y-2">
                      {topItems.map((item, i) => {
                        const maxV = topItems[0]?.votes || 1;
                        const pct = ((item.votes || 0) / maxV) * 100;
                        return (
                          <div key={item.id}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.2rem' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span style={{
                                  width: 20, height: 20, borderRadius: 6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                  background: i === 0 ? 'rgba(200,169,110,0.15)' : 'var(--glass)',
                                  fontWeight: 700, fontSize: '0.65rem', color: i === 0 ? 'var(--gold)' : 'var(--text-muted)',
                                }}>{i + 1}</span>
                                {item.name}
                              </span>
                              <span className="font-semibold text-xs" style={{ color: 'var(--gold-light)' }}>{item.votes}</span>
                            </div>
                            <div className="progress-bar">
                              <motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.08 * i }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm" style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>Aucun plat au menu</p>
            )}
          </SectionCard>

          {/* ════════ Gifts ════════ */}
          <SectionCard title={tr.totalGifts} icon={Gift} iconColor="#E879A0" delay={11}>
            {totalGifts > 0 ? (
              <>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '1rem', marginBottom: '1rem', borderRadius: 14,
                  background: 'linear-gradient(135deg, rgba(232,121,160,0.08), rgba(232,121,160,0.02))',
                  border: '1px solid rgba(232,121,160,0.15)',
                }}>
                  <div style={{ position: 'relative', width: 60, height: 60 }}>
                    <svg width="60" height="60" viewBox="0 0 60 60">
                      <circle cx="30" cy="30" r="25" fill="none" stroke="var(--glass-border)" strokeWidth="6" />
                      <motion.circle
                        cx="30" cy="30" r="25" fill="none" stroke="#E879A0" strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={`${(giftRate / 100) * 157} 157`}
                        transform="rotate(-90 30 30)"
                        initial={{ strokeDasharray: '0 157' }}
                        animate={{ strokeDasharray: `${(giftRate / 100) * 157} 157` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                      />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#E879A0' }}>
                      {giftRate}%
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold" style={{ fontSize: '0.9rem' }}>{reservedGifts}/{totalGifts} réservés</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {reservedGiftValue > 0 ? `${reservedGiftValue.toLocaleString(lang === 'en' ? 'en-US' : 'fr-FR')} € sur ${totalGiftValue.toLocaleString(lang === 'en' ? 'en-US' : 'fr-FR')} €` : tr.noValueSet}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <MiniBadge label="Cadeaux réservés" value={reservedGifts} color="#22964F" />
                  <MiniBadge label="Cadeaux disponibles" value={totalGifts - reservedGifts} color="#DC8C28" />
                  {reservedGiftValue > 0 && <MiniBadge label="Valeur réservée" value={`${reservedGiftValue.toLocaleString('fr-FR')} €`} color="#E879A0" />}
                  {totalGiftValue > 0 && <MiniBadge label="Valeur totale liste" value={`${totalGiftValue.toLocaleString('fr-FR')} €`} color="#5B8DB8" />}
                </div>
              </>
            ) : (
              <p className="text-sm" style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>Aucun cadeau configuré</p>
            )}
          </SectionCard>

          {/* ════════ Dietary ════════ */}
          <SectionCard title="Régimes alimentaires" icon={UtensilsCrossed} iconColor="#22964F" delay={12}>
            {diets.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {diets.map(([name, count]) => (
                  <div key={name} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem', borderRadius: 12,
                    background: 'var(--glass)', border: '1px solid var(--glass-border)',
                  }}>
                    <span className="text-sm" style={{ textTransform: 'capitalize' }}>{name}</span>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.55rem', borderRadius: 6,
                      background: 'rgba(220,140,40,0.1)', color: '#DC8C28',
                    }}>{count} {count > 1 ? tr.guests : tr.guest}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>Aucun régime renseigné</p>
            )}
          </SectionCard>

          {/* ════════ Engagement ════════ */}
          <SectionCard title="Engagement" icon={Zap} iconColor="#F59E0B" delay={13}>
            {/* Messages privés */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '1rem',
              padding: '1rem', marginBottom: '1rem', borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.02))',
              border: '1px solid rgba(245,158,11,0.15)',
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <MessageCircle size={22} style={{ color: '#F59E0B' }} />
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#F59E0B', lineHeight: 1 }}>{privateMessages}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>message{privateMessages > 1 ? 's' : ''} privé{privateMessages > 1 ? 's' : ''} reçu{privateMessages > 1 ? 's' : ''}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <MiniBadge label="Visites du lien" value={event.views || 0} color="#8B5CF6" />
              <MiniBadge label="Réponses reçues" value={`${responded}/${total}`} color="#22964F" />
              <MiniBadge label="Taux de réponse" value={`${total > 0 ? Math.round((responded / total) * 100) : 0}%`} color="#5B8DB8" />
              <MiniBadge label="Taux de conversion" value={`${(event.views || 0) > 0 ? Math.round((responded / (event.views || 1)) * 100) : 0}%`} color="#C8A96E" />
              <MiniBadge label="Restrictions alimentaires" value={`${guestsWithAllergies} invité${guestsWithAllergies > 1 ? 's' : ''}`} color="#DC8C28" />
              {totalVotes > 0 && <MiniBadge label="Votes sondage menu" value={totalVotes} color="#FB923C" />}
            </div>

            {/* Côté marié(e) */}
            {(brideGuests > 0 || groomGuests > 0) && (
              <div style={{ marginTop: '1rem' }}>
                <div className="text-xs font-medium" style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Répartition par côté
                </div>
                <div style={{
                  display: 'flex', height: 28, borderRadius: 8, overflow: 'hidden',
                  border: '1px solid var(--glass-border)',
                }}>
                  {brideGuests > 0 && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(brideGuests / total) * 100}%` }}
                      transition={{ duration: 0.8 }}
                      style={{
                        background: 'linear-gradient(135deg, #E879A0, #F9A8C9)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.65rem', fontWeight: 600, color: '#fff',
                      }}
                    >
                      👰 {brideGuests}
                    </motion.div>
                  )}
                  {bothGuests > 0 && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(bothGuests / total) * 100}%` }}
                      transition={{ duration: 0.8 }}
                      style={{
                        background: 'linear-gradient(135deg, #C8A96E, #D4B88A)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.65rem', fontWeight: 600, color: '#fff',
                      }}
                    >
                      💑 {bothGuests}
                    </motion.div>
                  )}
                  {groomGuests > 0 && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(groomGuests / total) * 100}%` }}
                      transition={{ duration: 0.8 }}
                      style={{
                        background: 'linear-gradient(135deg, #5B8DB8, #7DAED4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.65rem', fontWeight: 600, color: '#fff',
                      }}
                    >
                      🤵 {groomGuests}
                    </motion.div>
                  )}
                  {noSideGuests > 0 && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(noSideGuests / total) * 100}%` }}
                      transition={{ duration: 0.8 }}
                      style={{
                        background: 'var(--glass)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)',
                      }}
                    >
                      {noSideGuests}
                    </motion.div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.4rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {brideGuests > 0 && <span className="text-xs" style={{ color: '#E879A0' }}>👰 Mariée: {brideGuests}</span>}
                  {groomGuests > 0 && <span className="text-xs" style={{ color: '#5B8DB8' }}>🤵 Marié: {groomGuests}</span>}
                  {bothGuests > 0 && <span className="text-xs" style={{ color: '#C8A96E' }}>💑 Les deux: {bothGuests}</span>}
                </div>
              </div>
            )}
          </SectionCard>
        </div>
      </main>
    </div>
  );
}
