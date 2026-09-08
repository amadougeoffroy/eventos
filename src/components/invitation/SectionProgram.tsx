'use client';
import { Event, Venue } from '@/lib/types';
import { motion } from 'framer-motion';
import { MapPin, Navigation } from 'lucide-react';

export default function SectionProgram({ event, venues }: { event: Event; venues: Venue[] }) {
  if (event.program.length === 0) return null;
  return (
    <section style={{ background: 'var(--t-bg-warm, var(--bg-section))', padding: '5rem 1.5rem' }}>
      <div style={{ maxWidth: 576, margin: '0 auto' }}>
        <motion.h2
          className="font-display text-3xl font-bold"
          style={{ textAlign: 'center', marginBottom: '3rem' }}
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        >
          Programme de la <span className="gradient-gold">journée</span>
        </motion.h2>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          {event.program.map((item, idx) => {
            const venue = item.venueId ? venues.find(v => v.id === item.venueId) : null;
            return (
              <div key={item.id} style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
                {idx < event.program.length - 1 && (
                  <div style={{
                    position: 'absolute', left: 19, top: 40, bottom: 0, width: 2,
                    background: 'linear-gradient(to bottom, var(--t-accent, var(--gold)), rgba(200,169,110,0.2))',
                  }} />
                )}
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--t-accent, var(--gold)), var(--t-accent, var(--gold-light)))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: '0.9rem', zIndex: 1,
                }}>{idx + 1}</div>
                <div style={{ flex: 1, paddingBottom: idx < event.program.length - 1 ? '1.5rem' : '0' }}>
                  <div style={{
                    background: 'var(--t-card-bg, var(--bg-card))', border: '1px solid var(--t-card-border, var(--border-light))',
                    borderRadius: 14, padding: '0.85rem 1rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 700, color: 'var(--t-accent, var(--gold))',
                        padding: '0.15rem 0.5rem', borderRadius: 6,
                        background: 'rgba(200,169,110,0.1)',
                      }}>{item.time}</span>
                      <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                    </div>
                    <div className="font-semibold" style={{ fontSize: '0.9rem' }}>{item.title}</div>
                    {item.description && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--t-text-muted, var(--text-muted))', marginTop: '0.15rem' }}>{item.description}</div>
                    )}
                    {venue && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.35rem', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--t-text-muted, var(--text-muted))' }}>
                          <MapPin size={11} /> {venue.name}
                        </div>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${(venue.lat && venue.lng) ? `${venue.lat},${venue.lng}` : encodeURIComponent(venue.address || venue.name)}`}
                          target="_blank" rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                            fontSize: '0.6rem', fontWeight: 600, color: 'var(--t-accent, var(--gold))',
                            padding: '0.15rem 0.4rem', borderRadius: 5,
                            background: 'rgba(200,169,110,0.1)', textDecoration: 'none',
                            flexShrink: 0,
                          }}
                        >
                          <Navigation size={9} /> Maps
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
