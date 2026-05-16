'use client';
import Sidebar from '@/components/Sidebar';
import { useApp } from '@/context/AppContext';
import { motion } from 'framer-motion';
import { use, useEffect, useMemo, useState } from 'react';
import { Send, Copy, Check, ExternalLink, Mail, Phone, MessageSquare, Link2, Users, AlertCircle } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.45 } })
};

export default function InvitationsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const { events, guests } = useApp();
  const event = events.find(e => e.id === eventId);
  const eventGuests = useMemo(() => guests.filter(g => g.eventId === eventId), [guests, eventId]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedGeneric, setCopiedGeneric] = useState(false);

  if (!event) return <div className="flex"><Sidebar /><main className="main-content"><p>Événement non trouvé</p></main></div>;

  const [baseUrl, setBaseUrl] = useState('');
  useEffect(() => { setBaseUrl(window.location.origin); }, []);
  const genericLink = `${baseUrl}/e/${event.slug}`;

  const copyPersonalLink = (guest: typeof eventGuests[0]) => {
    const link = `${baseUrl}/e/${event.slug}?guest=${encodeURIComponent(`${guest.firstName}-${guest.lastName}`)}&token=${guest.token}`;
    navigator.clipboard.writeText(link);
    setCopiedId(guest.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyGenericLink = () => {
    navigator.clipboard.writeText(genericLink);
    setCopiedGeneric(true);
    setTimeout(() => setCopiedGeneric(false), 2000);
  };

  const pending = eventGuests.filter(g => g.rsvpStatus === 'pending');
  const sent = eventGuests.filter(g => g.rsvpStatus !== 'pending').length;

  return (
    <div className="flex">
      <Sidebar eventId={eventId} />
      <main className="main-content">
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 className="font-display text-2xl font-bold" style={{ marginBottom: '0.15rem' }}>Invitations</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{event.name}</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total invités', value: eventGuests.length, color: '#5B8DB8', bg: 'linear-gradient(135deg, rgba(91,141,184,0.12), rgba(91,141,184,0.04))', icon: Users },
            { label: 'Ont répondu', value: sent, color: '#22964F', bg: 'linear-gradient(135deg, rgba(34,150,79,0.12), rgba(34,150,79,0.04))', icon: Check },
            { label: 'Sans réponse', value: pending.length, color: '#DC8C28', bg: 'linear-gradient(135deg, rgba(220,140,40,0.12), rgba(220,140,40,0.04))', icon: AlertCircle },
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
              </motion.div>
            );
          })}
        </div>

        {/* Generic Link Card */}
        <motion.div
          initial="hidden" animate="visible" variants={fadeUp} custom={3}
          style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-light)',
            borderRadius: '1.25rem', padding: '1.5rem', marginBottom: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(200,169,110,0.1)', border: '1px solid rgba(200,169,110,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Link2 size={18} color="#C8A96E" />
            </div>
            <div>
              <h3 className="font-semibold" style={{ fontSize: '0.95rem' }}>Lien générique</h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Partagez ce lien avec n&apos;importe qui</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{
              flex: 1, padding: '0.65rem 0.85rem', borderRadius: 10,
              background: 'var(--glass)', border: '1px solid var(--glass-border)',
              fontSize: '0.85rem', color: 'var(--gold-light)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {genericLink}
            </div>
            <button className="btn-primary" onClick={copyGenericLink}>
              {copiedGeneric ? <><Check size={16} /> Copié !</> : <><Copy size={16} /> Copier</>}
            </button>
          </div>
        </motion.div>

        {/* Personalized Links */}
        <motion.div
          initial="hidden" animate="visible" variants={fadeUp} custom={4}
          style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-light)',
            borderRadius: '1.25rem', padding: '1.5rem', marginBottom: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(91,141,184,0.1)', border: '1px solid rgba(91,141,184,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Send size={18} color="#5B8DB8" />
              </div>
              <div>
                <h3 className="font-semibold" style={{ fontSize: '0.95rem' }}>Liens personnalisés</h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Chaque invité a un lien unique avec son nom pré-rempli</p>
              </div>
            </div>
            <span style={{
              fontSize: '0.75rem', fontWeight: 600, padding: '0.3rem 0.7rem',
              borderRadius: 8, background: 'var(--glass)', color: 'var(--text-muted)',
            }}>
              {eventGuests.length} invités
            </span>
          </div>

          <div className="space-y-2" style={{ maxHeight: 500, overflowY: 'auto' }}>
            {eventGuests.map((guest) => (
              <div key={guest.id} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem', borderRadius: 12,
                background: 'var(--glass)', border: '1px solid var(--glass-border)',
                flexWrap: 'wrap',
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: 'rgba(200,169,110,0.12)', border: '1px solid rgba(200,169,110,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 600, color: 'var(--gold-light)', flexShrink: 0,
                }}>
                  {guest.firstName[0]}{guest.lastName[0]}
                </div>
                <div style={{ flex: 1, minWidth: '100px' }}>
                  <div className="font-medium text-sm">{guest.firstName} {guest.lastName}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{guest.group}</div>
                </div>
                <span className={`badge ${guest.rsvpStatus === 'confirmed' ? 'badge-confirmed' : guest.rsvpStatus === 'declined' ? 'badge-declined' : guest.rsvpStatus === 'maybe' ? 'badge-maybe' : 'badge-pending'}`} style={{ fontSize: 10 }}>
                  {guest.rsvpStatus === 'confirmed' ? 'Confirmé' : guest.rsvpStatus === 'declined' ? 'Décliné' : guest.rsvpStatus === 'maybe' ? 'Peut-être' : 'En attente'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                  <button className="btn-ghost p-1.5" title="Copier le lien" onClick={() => copyPersonalLink(guest)}>
                    {copiedId === guest.id ? <Check size={14} style={{ color: '#22964F' }} /> : <Copy size={14} />}
                  </button>
                  {guest.email && <button className="btn-ghost p-1.5" title="Envoyer par email"><Mail size={14} /></button>}
                  {guest.phone && <button className="btn-ghost p-1.5" title="Envoyer par SMS"><Phone size={14} /></button>}
                  {guest.phone && <button className="btn-ghost p-1.5" title="Envoyer par WhatsApp"><MessageSquare size={14} /></button>}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Relance */}
        {pending.length > 0 && (
          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} custom={5}
            style={{
              background: 'linear-gradient(135deg, rgba(220,140,40,0.08), rgba(220,140,40,0.02))',
              border: '1px solid rgba(220,140,40,0.2)',
              borderRadius: '1.25rem', padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(220,140,40,0.12)', border: '1px solid rgba(220,140,40,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <AlertCircle size={18} color="#DC8C28" />
              </div>
              <div>
                <h3 className="font-semibold" style={{ fontSize: '0.95rem' }}>Relancer les invités</h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{pending.length} invité(s) n&apos;ont pas encore répondu</p>
              </div>
            </div>
            <button className="btn-primary">
              <Send size={16} /> Relancer {pending.length} invité(s)
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
