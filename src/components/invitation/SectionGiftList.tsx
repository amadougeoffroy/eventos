'use client';
import { Event, GiftItem } from '@/lib/types';
import { motion } from 'framer-motion';
import { Gift, ExternalLink, Check } from 'lucide-react';
import { useState } from 'react';

interface SectionGiftListProps {
  event: Event;
  gifts: GiftItem[];
  onReserve?: (giftId: string) => void;
}

export default function SectionGiftList({ event, gifts, onReserve }: SectionGiftListProps) {
  const [reservedLocally, setReservedLocally] = useState<Set<string>>(new Set());

  // Don't render if no gifts
  if (!gifts || gifts.length === 0) return null;

  const handleReserve = (giftId: string) => {
    setReservedLocally(prev => new Set(prev).add(giftId));
    onReserve?.(giftId);
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
          <p className="text-sm" style={{ color: 'var(--t-text-muted, var(--text-muted))' }}>
            Votre présence est le plus beau des cadeaux
          </p>
        </motion.div>

        {categories.map((cat, ci) => (
          <div key={cat} style={{ marginBottom: '2rem' }}>
            {categories.length > 1 && (
              <motion.h3
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                className="font-display" style={{
                  fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem',
                  color: 'var(--t-text, var(--text))',
                  paddingBottom: '0.5rem',
                  borderBottom: '1px solid var(--t-accent, var(--gold))33',
                }}>
                {cat}
              </motion.h3>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {gifts.filter(g => g.category === cat).map((gift, i) => {
                const isReserved = gift.reserved || reservedLocally.has(gift.id);
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
                      border: isReserved
                        ? '1px solid rgba(34,150,79,0.25)'
                        : '1px solid var(--t-accent, var(--gold))20',
                      background: isReserved
                        ? 'rgba(34,150,79,0.06)'
                        : 'var(--t-bg, var(--glass))',
                      display: 'flex', alignItems: 'center', gap: '1rem',
                      opacity: isReserved ? 0.7 : 1,
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {/* Icon / Image */}
                    <div style={{
                      width: 50, height: 50, borderRadius: 12, flexShrink: 0,
                      background: 'linear-gradient(135deg, var(--t-accent, var(--gold))15, var(--t-accent, var(--gold))05)',
                      border: '1px solid var(--t-accent, var(--gold))20',
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
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                      {gift.url && (
                        <a href={gift.url} target="_blank" rel="noopener noreferrer" style={{
                          width: 36, height: 36, borderRadius: 10,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'var(--t-bg-warm, var(--bg-warm))',
                          border: '1px solid var(--t-accent, var(--gold))20',
                          color: 'var(--t-text-muted, var(--text-muted))',
                          textDecoration: 'none',
                        }}>
                          <ExternalLink size={14} />
                        </a>
                      )}
                      {!isReserved ? (
                        <button onClick={() => handleReserve(gift.id)} style={{
                          padding: '0.4rem 0.75rem', borderRadius: 10,
                          background: 'linear-gradient(135deg, var(--t-accent, var(--gold)), var(--t-secondary, #B8944F))',
                          color: '#fff', fontWeight: 600, fontSize: '0.7rem',
                          border: 'none', cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}>
                          Réserver
                        </button>
                      ) : (
                        <div style={{
                          padding: '0.4rem 0.75rem', borderRadius: 10,
                          background: 'rgba(34,150,79,0.1)',
                          color: '#22964F', fontWeight: 600, fontSize: '0.7rem',
                          display: 'flex', alignItems: 'center', gap: '0.25rem',
                          whiteSpace: 'nowrap',
                        }}>
                          <Check size={12} /> Réservé
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
