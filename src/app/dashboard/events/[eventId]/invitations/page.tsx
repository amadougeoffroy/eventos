'use client';
import Sidebar from '@/components/Sidebar';
import EventLoader from '@/components/EventLoader';
import { useApp } from '@/context/AppContext';
import { useThemeLanguage } from '@/context/ThemeLanguageContext';
import { motion } from 'framer-motion';
import { use, useEffect, useMemo, useState } from 'react';
import { Send, Copy, Check, ExternalLink, Mail, MessageSquare, Link2, Users, AlertCircle } from 'lucide-react';

const WhatsAppIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ color: '#25D366' }}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.45 } })
};

export default function InvitationsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const { events, guests, eventsLoading } = useApp();
  const { t } = useThemeLanguage();
  const tr = t('invitations');
  const event = events.find(e => e.id === eventId);
  const eventGuests = useMemo(() => guests.filter(g => g.eventId === eventId), [guests, eventId]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedGeneric, setCopiedGeneric] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');
  useEffect(() => { setBaseUrl(window.location.origin); }, []);

  if (!event) return eventsLoading ? <EventLoader /> : <div className="flex"><Sidebar /><main className="main-content"><p>{tr.eventNotFound}</p></main></div>;

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
          <h1 className="font-display text-2xl font-bold" style={{ marginBottom: '0.15rem' }}>{tr.title}</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{event.name}</p>
        </div>

        {/* Stats row */}
        <div className="inv-stats grid grid-cols-3 gap-4 mb-6">
          {[
            { label: tr.total, value: eventGuests.length, color: '#5B8DB8', bg: 'linear-gradient(135deg, rgba(91,141,184,0.12), rgba(91,141,184,0.04))', icon: Users },
            { label: tr.sent, value: sent, color: '#22964F', bg: 'linear-gradient(135deg, rgba(34,150,79,0.12), rgba(34,150,79,0.04))', icon: Check },
            { label: tr.notSent, value: pending.length, color: '#DC8C28', bg: 'linear-gradient(135deg, rgba(220,140,40,0.12), rgba(220,140,40,0.04))', icon: AlertCircle },
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
              <h3 className="font-semibold" style={{ fontSize: '0.95rem' }}>{tr.genericLink}</h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{tr.genericLinkDesc}</p>
            </div>
          </div>
          <div className="inv-link-row" style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{
              flex: 1, padding: '0.65rem 0.85rem', borderRadius: 10,
              background: 'var(--glass)', border: '1px solid var(--glass-border)',
              fontSize: '0.85rem', color: 'var(--gold-light)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {genericLink}
            </div>
            <button className="btn-primary" onClick={copyGenericLink}>
              {copiedGeneric ? <><Check size={16} /> {tr.linkCopied}</> : <><Copy size={16} /> {tr.copyLink}</>}
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
                <h3 className="font-semibold" style={{ fontSize: '0.95rem' }}>{tr.personalLinks}</h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{tr.personalLinksDesc}</p>
              </div>
            </div>
            <span style={{
              fontSize: '0.75rem', fontWeight: 600, padding: '0.3rem 0.7rem',
              borderRadius: 8, background: 'var(--glass)', color: 'var(--text-muted)',
            }}>
              {tr.nGuests.replace('{n}', String(eventGuests.length))}
            </span>
          </div>

          <div className="space-y-2" style={{ maxHeight: 500, overflowY: 'auto' }}>
            {eventGuests.map((guest) => (
              <div key={guest.id} className="inv-guest-row" style={{
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
                  {guest.rsvpStatus === 'confirmed' ? tr.confirmed : guest.rsvpStatus === 'declined' ? tr.declined : guest.rsvpStatus === 'maybe' ? tr.maybe : tr.pending}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                  {guest.source === 'rsvp' ? (
                    <span style={{ fontSize: '0.6rem', padding: '0.15rem 0.45rem', borderRadius: 4, background: 'rgba(59,130,246,0.1)', color: '#60A5FA', fontWeight: 500 }}>
                      {tr.autoRegistered}
                    </span>
                  ) : (
                    <>
                      <button className="btn-ghost p-1.5" title={tr.copyLink} onClick={() => copyPersonalLink(guest)}>
                        {copiedId === guest.id ? <Check size={14} style={{ color: '#22964F' }} /> : <Copy size={14} />}
                      </button>
                      {(event.plan === 'pro' || event.plan === 'premium') && guest.phone && (
                        <button className="btn-ghost p-1.5" title={tr.sendSms}><MessageSquare size={14} /></button>
                      )}
                      {event.plan === 'premium' && guest.phone && (
                        <button className="btn-ghost p-1.5" title={tr.sendWhatsapp}><WhatsAppIcon size={14} /></button>
                      )}
                    </>
                  )}
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
                <h3 className="font-semibold" style={{ fontSize: '0.95rem' }}>{tr.followUp}</h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{tr.followUpDesc.replace('{n}', String(pending.length))}</p>
              </div>
            </div>
            <button className="btn-primary">
              <Send size={16} /> {tr.followUpBtn.replace('{n}', String(pending.length))}
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
