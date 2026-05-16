'use client';
import Sidebar from '@/components/Sidebar';
import { useApp } from '@/context/AppContext';
import { motion } from 'framer-motion';
import { use, useMemo } from 'react';
import { BarChart3, Users, UtensilsCrossed, TrendingUp, PieChart } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.45 } })
};

export default function StatsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const { events, guests, menuItems, menuCategories } = useApp();
  const event = events.find(e => e.id === eventId);
  const eventGuests = useMemo(() => guests.filter(g => g.eventId === eventId), [guests, eventId]);
  const evtItems = useMemo(() => menuItems.filter(i => i.eventId === eventId), [menuItems, eventId]);
  const evtCategories = useMemo(() => menuCategories.filter(c => c.eventId === eventId), [menuCategories, eventId]);

  if (!event) return <div className="flex"><Sidebar /><main className="main-content"><p>Événement non trouvé</p></main></div>;

  const total = eventGuests.length;
  const confirmed = eventGuests.filter(g => g.rsvpStatus === 'confirmed').length;
  const declined = eventGuests.filter(g => g.rsvpStatus === 'declined').length;
  const pending = eventGuests.filter(g => g.rsvpStatus === 'pending').length;
  const maybe = eventGuests.filter(g => g.rsvpStatus === 'maybe').length;
  const totalWithCompanions = eventGuests.reduce((sum, g) => sum + 1 + g.companions, 0);
  const confirmedWithCompanions = eventGuests.filter(g => g.rsvpStatus === 'confirmed').reduce((sum, g) => sum + 1 + g.companions, 0);

  const groups = useMemo(() => {
    const map = new Map<string, number>();
    eventGuests.forEach(g => map.set(g.group, (map.get(g.group) || 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [eventGuests]);

  const diets = useMemo(() => {
    const map = new Map<string, number>();
    eventGuests.forEach(g => g.dietaryRestrictions?.forEach(r => map.set(r, (map.get(r) || 0) + 1)));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [eventGuests]);

  const topItems = evtItems.filter(i => (i.votes || 0) > 0).sort((a, b) => (b.votes || 0) - (a.votes || 0)).slice(0, 5);

  const rsvpData = [
    { label: 'Confirmés', value: confirmed, pct: total > 0 ? Math.round((confirmed / total) * 100) : 0, color: '#22964F' },
    { label: 'En attente', value: pending, pct: total > 0 ? Math.round((pending / total) * 100) : 0, color: '#DC8C28' },
    { label: 'Déclinés', value: declined, pct: total > 0 ? Math.round((declined / total) * 100) : 0, color: '#DC3545' },
    { label: 'Peut-être', value: maybe, pct: total > 0 ? Math.round((maybe / total) * 100) : 0, color: '#A78BFA' },
  ];

  const kpiCards = [
    { label: 'Invités', value: total, sub: `${totalWithCompanions} avec accomp.`, icon: Users, color: '#5B8DB8', bg: 'linear-gradient(135deg, rgba(91,141,184,0.12), rgba(91,141,184,0.04))' },
    { label: 'Confirmés', value: confirmed, sub: `${confirmedWithCompanions} personnes`, icon: TrendingUp, color: '#22964F', bg: 'linear-gradient(135deg, rgba(34,150,79,0.12), rgba(34,150,79,0.04))' },
    { label: 'Taux RSVP', value: `${total > 0 ? Math.round(((confirmed + declined + maybe) / total) * 100) : 0}%`, sub: 'ont répondu', icon: PieChart, color: '#C8A96E', bg: 'linear-gradient(135deg, rgba(200,169,110,0.12), rgba(200,169,110,0.04))' },
    { label: 'Plats au menu', value: evtItems.length, sub: `${evtCategories.length} catégories`, icon: UtensilsCrossed, color: '#FB923C', bg: 'linear-gradient(135deg, rgba(251,146,60,0.12), rgba(251,146,60,0.04))' },
  ];

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

  return (
    <div className="flex">
      <Sidebar eventId={eventId} />
      <main className="main-content">
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 className="font-display text-2xl font-bold" style={{ marginBottom: '0.15rem' }}>Statistiques</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{event.name}</p>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {kpiCards.map((s, i) => {
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

        <div className="grid md:grid-cols-2 gap-5">
          {/* RSVP Breakdown */}
          <SectionCard title="Répartition RSVP" icon={BarChart3} iconColor="#C8A96E" delay={4}>
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
          </SectionCard>

          {/* Groups Breakdown */}
          <SectionCard title="Par groupe" icon={Users} iconColor="#5B8DB8" delay={5}>
            <div className="space-y-3">
              {groups.map(([name, count]) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={name}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                      <span>{name}</span>
                      <span className="font-semibold" style={{ color: 'var(--gold-light)' }}>{count}</span>
                    </div>
                    <div className="progress-bar">
                      <motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* Top Menu Items */}
          <SectionCard title="Plats les plus populaires" icon={UtensilsCrossed} iconColor="#FB923C" delay={6}>
            <div className="space-y-3">
              {topItems.map((item, i) => {
                const maxVotes = topItems[0]?.votes || 1;
                const pct = ((item.votes || 0) / maxVotes) * 100;
                const cat = evtCategories.find(c => c.id === item.categoryId);
                return (
                  <div key={item.id}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          width: 24, height: 24, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'rgba(200,169,110,0.1)', fontWeight: 700, fontSize: '0.7rem', color: 'var(--gold)',
                        }}>{i + 1}</span>
                        {item.name}
                      </span>
                      <span className="font-semibold" style={{ color: 'var(--gold-light)' }}>{item.votes} votes</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className="progress-bar" style={{ flex: 1 }}>
                        <motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.1 * i }} />
                      </div>
                      {cat && <span className="text-xs" style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{cat.icon} {cat.name}</span>}
                    </div>
                  </div>
                );
              })}
              {topItems.length === 0 && <p className="text-sm" style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>Aucun vote enregistré</p>}
            </div>
          </SectionCard>

          {/* Dietary Restrictions */}
          <SectionCard title="Régimes alimentaires" icon={UtensilsCrossed} iconColor="#22964F" delay={7}>
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
                    }}>{count} invité{count > 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>Aucun régime renseigné</p>
            )}
          </SectionCard>
        </div>
      </main>
    </div>
  );
}
