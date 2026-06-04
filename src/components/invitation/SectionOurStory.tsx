'use client';
import { Event } from '@/lib/types';
import { motion } from 'framer-motion';
import { Heart, BookOpen } from 'lucide-react';

export default function SectionOurStory({ event }: { event: Event }) {
  if (!event.meta.coupleStory) return null;
  
  // Parse story into paragraphs
  const paragraphs = event.meta.coupleStory.split('\n').filter(Boolean);
  
  return (
    <section style={{ background: 'var(--t-bg-warm, var(--bg-section))', padding: '5rem 1.5rem' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <motion.div
          style={{ textAlign: 'center', marginBottom: '3rem' }}
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        >
          <BookOpen size={32} style={{ color: 'var(--t-accent, var(--gold))', margin: '0 auto 1rem' }} />
          <h2 className="font-display text-3xl font-bold mb-2">
            Notre <span className="gradient-gold">histoire</span>
          </h2>
        </motion.div>

        <div style={{ position: 'relative', paddingLeft: '2rem' }}>
          {/* Vertical line */}
          <div style={{
            position: 'absolute', left: 6, top: 0, bottom: 0, width: 2,
            background: 'linear-gradient(to bottom, var(--t-accent, var(--gold)), transparent)',
          }} />
          
          {paragraphs.map((text, i) => (
            <motion.div
              key={i}
              style={{ marginBottom: '2rem', position: 'relative' }}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              {/* Dot on timeline */}
              <div style={{
                position: 'absolute', left: '-2rem', top: '0.3rem',
                width: 14, height: 14, borderRadius: '50%',
                background: 'var(--t-accent, var(--gold))',
                border: '3px solid var(--t-bg-warm, var(--bg-section))',
                zIndex: 1,
              }} />
              <div style={{
                background: 'var(--t-card-bg, var(--bg-card))',
                border: '1px solid var(--t-card-border, var(--border-light))',
                borderRadius: 'var(--t-radius, 14px)',
                padding: '1.25rem 1.5rem',
              }}>
                {i === 0 && <Heart size={16} style={{ color: 'var(--t-accent, var(--gold))', marginBottom: '0.5rem' }} />}
                <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--t-text, var(--text))' }}>{text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
