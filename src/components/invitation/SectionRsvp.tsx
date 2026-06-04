'use client';
import { Event, Guest } from '@/lib/types';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, HelpCircle, Users } from 'lucide-react';
import ParticleSystem from './ParticleSystem';

interface SectionRsvpProps {
  event: Event;
  knownGuest: Guest | null;
  groups: { id: string; name: string; emoji: string; color: string }[];
  updateGuest: (id: string, updates: Partial<Guest>) => void;
  addGuest: (guest: Guest) => void;
}

export default function SectionRsvp({ event, knownGuest, groups, updateGuest, addGuest }: SectionRsvpProps) {
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

  const isKnownGuest = !!knownGuest;

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

  const handleSubmit = async () => {
    if (!rsvpChoice) return;
    if (!guestName.trim() || !event) return;

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      if (knownGuest) {
        await supabase.from('guests').update({
          rsvp_status: rsvpChoice,
          companions,
          allergies,
          updated_at: new Date().toISOString(),
        }).eq('id', knownGuest.id);

        updateGuest(knownGuest.id, {
          rsvpStatus: rsvpChoice,
          companions,
          allergies,
          respondedAt: new Date().toISOString(),
        });
      } else {
        const [first, ...rest] = guestName.trim().split(' ');
        const token = `tok-${Date.now()}`;

        const { data: inserted } = await supabase.from('guests').insert({
          event_id: event.id,
          first_name: first,
          last_name: rest.join(' ') || '',
          phone: guestPhone || null,
          group: guestGroup || 'Invités',
          rsvp_status: rsvpChoice,
          token,
          companions,
          allergies: allergies || null,
        }).select().single();

        addGuest({
          id: inserted?.id || `g-${Date.now()}`,
          eventId: event.id,
          firstName: first,
          lastName: rest.join(' ') || '',
          phone: guestPhone,
          group: guestGroup || 'Invités',
          rsvpStatus: rsvpChoice,
          token,
          companions,
          privateMessage: privateMsg,
          allergies,
          dietaryRestrictions: [],
          respondedAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error('RSVP save error:', e);
    }

    setSubmitted(true);
    if (rsvpChoice === 'confirmed') {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    }
  };

  return (
    <section style={{ background: 'var(--t-bg-warm, var(--bg-section))', padding: '5rem 1.5rem', position: 'relative' }}>
      {showConfetti && <ParticleSystem type="stars" />}
      <div style={{ maxWidth: 512, margin: '0 auto' }}>
        <motion.div
          style={{ textAlign: 'center', marginBottom: '2.5rem' }}
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        >
          <h2 className="font-display text-3xl font-bold mb-2">
            Confirmez votre <span className="gradient-gold">présence</span>
          </h2>
          <p className="text-sm" style={{ color: 'var(--t-text-muted, var(--text-muted))' }}>Nous avons hâte de savoir si vous serez des nôtres</p>
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
                  <Check size={16} style={{ color: 'var(--t-accent, var(--gold))', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Bienvenue <strong style={{ color: 'var(--t-accent, var(--gold))' }}>{guestName}</strong> ! Vos informations sont pré-remplies.
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
                    <Users size={14} style={{ color: 'var(--t-accent, var(--gold))' }} />
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
              ) : groups.length > 0 && (
                <div className="mb-6">
                  <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Users size={14} style={{ color: 'var(--t-accent, var(--gold))' }} />
                    Votre groupe
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem' }}>
                    {groups.map(g => {
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
                            border: `1.5px solid ${selected ? 'var(--t-accent, var(--gold))' : 'var(--border-light)'}`,
                            color: selected ? 'var(--t-accent, var(--gold))' : 'var(--text-muted)',
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {[
                    { value: 'confirmed' as const, label: 'Je serai là !', icon: Check, color: '#22964F', bg: 'rgba(34,150,80,0.08)', full: true },
                    { value: 'declined' as const, label: 'Absent(e)', icon: X, color: '#DC3545', bg: 'rgba(220,53,69,0.06)', full: false },
                    { value: 'maybe' as const, label: 'Peut-être', icon: HelpCircle, color: '#7C58BA', bg: 'rgba(124,88,186,0.06)', full: false },
                  ].map(opt => {
                    const Icon = opt.icon;
                    const selected = rsvpChoice === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setRsvpChoice(opt.value)}
                        style={{
                          gridColumn: opt.full ? '1 / -1' : undefined,
                          display: 'flex', flexDirection: opt.full ? 'row' : 'column',
                          alignItems: 'center', justifyContent: 'center',
                          gap: opt.full ? '0.6rem' : '0.5rem',
                          padding: opt.full ? '1rem' : '0.85rem 0.5rem',
                          borderRadius: 12,
                          background: selected ? opt.bg : 'var(--glass)',
                          border: `2px solid ${selected ? opt.color : 'var(--border-light)'}`,
                          color: selected ? opt.color : 'var(--text-muted)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          fontWeight: selected ? 600 : 400,
                        }}
                      >
                        <Icon size={opt.full ? 22 : 20} />
                        <span style={{ fontSize: opt.full ? '0.9rem' : '0.75rem', fontWeight: 500 }}>{opt.label}</span>
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
                      {event.allowCompanions && (
                        <div>
                          <label className="label flex items-center gap-2">
                            <Users size={14} style={{ color: 'var(--t-accent, var(--gold))' }} />
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
                                        padding: '0.75rem', borderRadius: '0.75rem',
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
                  <motion.div className="text-6xl mb-4" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5 }}>🎉</motion.div>
                  <h3 className="font-display text-2xl font-bold mb-2">Merci {guestName.split(' ')[0]} !</h3>
                  <p style={{ color: 'var(--t-text-muted, var(--text-muted))' }}>Votre présence est confirmée. Nous avons hâte de vous retrouver !</p>
                </>
              ) : rsvpChoice === 'declined' ? (
                <>
                  <div className="text-5xl mb-4">😢</div>
                  <h3 className="font-display text-2xl font-bold mb-2">C&apos;est noté</h3>
                  <p style={{ color: 'var(--t-text-muted, var(--text-muted))' }}>Nous comprenons. Vous nous manquerez !</p>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-4">🤔</div>
                  <h3 className="font-display text-2xl font-bold mb-2">Pas de souci !</h3>
                  <p style={{ color: 'var(--t-text-muted, var(--text-muted))' }}>Prenez votre temps. Nous vous relancerons bientôt.</p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
