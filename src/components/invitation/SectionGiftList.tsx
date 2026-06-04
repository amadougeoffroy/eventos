'use client';
import { Event, GiftItem } from '@/lib/types';
import { motion } from 'framer-motion';
import { Gift, ExternalLink, Check, Heart } from 'lucide-react';
import { useState } from 'react';

interface SectionGiftListProps {
  event: Event;
  gifts: GiftItem[];
  guestName?: string;
  hasRsvpd?: boolean;
  onReserve?: (giftId: string, guestName: string) => void;
}

export default function SectionGiftList({ event, gifts, guestName, hasRsvpd, onReserve }: SectionGiftListProps) {
  const [reservedLocally, setReservedLocally] = useState<Set<string>>(new Set());

  // Don't render if no gifts
  if (!gifts || gifts.length === 0) return null;

  const handleReserve = (giftId: string) => {
    if (!hasRsvpd || !guestName) return;
    setReservedLocally(prev => new Set(prev).add(giftId));
    onReserve?.(giftId, guestName);
  };

  // Group by category
  const categories = Array.from(new Set(gifts.map(g => g.category)));

  return (
    <section style={{ background: 'var(--t-bg-warm, var(--bg-section))', padding: '5rem 1.5rem' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <motion.div
          style={{ textAlign: 'center', marginBottom: '2.5rem' }}
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        >
          <Gift size={32} style={{ color: 'var(--t-accent, var(--gold))', margin: '0 auto 1rem' }} />
          <h2 className="font-display text-3xl font-bold mb-2">
            Liste de <span className="gradient-gold">cadeaux</span>
          </h2>
          <p className="text-sm" style={{ color: 'var(--t-text-muted, var(--text-muted))', lineHeight: 1.6 }}>
            Si vous souhaitez nous gâter, nous avons préparé une petite sélection pour vous inspirer.
          </p>
        </motion.div>

        {/* Message if not RSVPd */}
        {!hasRsvpd && (
          <motion.div
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            style={{
              textAlign: 'center', padding: '1rem 1.25rem', marginBottom: '1.5rem',
              borderRadius: 12,
              background: 'rgba(200,169,110,0.08)',
              border: '1px solid rgba(200,169,110,0.2)',
              fontSize: '0.8rem', color: 'var(--t-text-muted, var(--text-muted))',
              lineHeight: 1.5,
            }}
          >
            💌 Confirmez votre présence ci-dessus pour pouvoir indiquer les cadeaux que vous souhaitez offrir.
          </motion.div>
        )}

        {categories.map((cat) => (
          <div key={cat} style={{ marginBottom: '2rem' }}>
            {categories.length > 1 && (
              <motion.h3
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                className="font-display" style={{
                  fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem',
                  color: 'var(--t-text, var(--text))',
                  paddingBottom: '0.5rem',
                  borderBottom: '1px solid rgba(200,169,110,0.2)',
                }}>
                {cat}
              </motion.h3>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {gifts.filter(g => g.category === cat).map((gift, i) => {
                const allNames = gift.reservedByName ? gift.reservedByName.split(', ').filter(Boolean) : [];
                const iOffered = reservedLocally.has(gift.id) || (guestName ? allNames.includes(guestName) : false);
                const displayNames = iOffered && guestName && !allNames.includes(guestName)
                  ? [...allNames, guestName] : allNames;
                return (
                  <motion.div
                    key={gift.id}
                    className="card"
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    style={{
                      padding: '1rem 1.25rem',
                      borderRadius: 'var(--t-radius, 14px)',
                      border: iOffered
                        ? '1px solid rgba(34,150,79,0.25)'
                        : '1px solid rgba(200,169,110,0.15)',
                      background: iOffered
                        ? 'rgba(34,150,79,0.06)'
                        : 'var(--t-bg, var(--glass))',
                      display: 'flex', alignItems: 'center', gap: '1rem',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {/* Icon / Image */}
                    <div style={{
                      width: 50, height: 50, borderRadius: 12, flexShrink: 0,
                      background: 'linear-gradient(135deg, rgba(200,169,110,0.15), rgba(200,169,110,0.05))',
                      border: '1px solid rgba(200,169,110,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden',
                    }}>
                      {gift.imageUrl ? (
                        <img src={gift.imageUrl} alt={gift.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '1.5rem' }}>🎁</span>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--t-text, var(--text))' }}>
                        {gift.name}
                      </div>
                      {gift.description && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--t-text-muted, var(--text-muted))', marginTop: '0.15rem', lineHeight: 1.4 }}>
                          {gift.description}
                        </div>
                      )}
                      {gift.price && (
                        <div style={{
                          fontSize: '0.8rem', fontWeight: 700, marginTop: '0.25rem',
                          color: 'var(--t-accent, var(--gold))',
                        }}>
                          {gift.price.toLocaleString('fr-FR')}€
                        </div>
                      )}
                      {displayNames.length > 0 && (
                        <div style={{
                          fontSize: '0.65rem', color: '#22964F', marginTop: '0.3rem',
                          fontWeight: 600, opacity: 0.85,
                        }}>
                          ♥ {displayNames.join(', ')}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0, alignItems: 'center' }}>
                      {gift.url && (
                        <a href={gift.url} target="_blank" rel="noopener noreferrer" style={{
                          width: 36, height: 36, borderRadius: 10,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'var(--t-bg-warm, var(--bg-warm))',
                          border: '1px solid rgba(200,169,110,0.2)',
                          color: 'var(--t-text-muted, var(--text-muted))',
                          textDecoration: 'none',
                        }}>
                          <ExternalLink size={14} />
                        </a>
                      )}
                      {!iOffered ? (
                        <button
                          onClick={() => handleReserve(gift.id)}
                          disabled={!hasRsvpd}
                          style={{
                            padding: '0.4rem 0.75rem', borderRadius: 10,
                            background: hasRsvpd
                              ? 'linear-gradient(135deg, var(--t-accent, var(--gold)), var(--t-secondary, #B8944F))'
                              : 'var(--t-bg-warm, var(--bg-warm))',
                            color: hasRsvpd ? '#fff' : 'var(--t-text-muted, var(--text-muted))',
                            fontWeight: 600, fontSize: '0.7rem',
                            border: hasRsvpd ? 'none' : '1px solid rgba(200,169,110,0.2)',
                            cursor: hasRsvpd ? 'pointer' : 'not-allowed',
                            whiteSpace: 'nowrap',
                            display: 'flex', alignItems: 'center', gap: '0.3rem',
                            opacity: hasRsvpd ? 1 : 0.6,
                          }}>
                          <Heart size={12} /> J&apos;offrirai
                        </button>
                      ) : (
                        <div style={{
                          padding: '0.4rem 0.75rem', borderRadius: 10,
                          background: 'rgba(34,150,79,0.1)',
                          color: '#22964F', fontWeight: 600, fontSize: '0.7rem',
                          display: 'flex', alignItems: 'center', gap: '0.25rem',
                          whiteSpace: 'nowrap',
                        }}>
                          <Check size={12} /> J&apos;offrirai
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
