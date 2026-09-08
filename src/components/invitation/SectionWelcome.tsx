'use client';
import { Event } from '@/lib/types';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

export default function SectionWelcome({ event }: { event: Event }) {
  if (!event.welcomeMessage) return null;
  return (
    <section style={{ background: 'var(--t-bg, var(--bg))', padding: '5rem 1.5rem' }}>
      <motion.div
        style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}
        initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      >
        {event.type === 'wedding' && <Heart size={32} style={{ color: 'var(--t-accent, var(--rose-deep))', margin: '0 auto 1rem' }} />}
        <p className="text-xl md:text-2xl italic leading-relaxed" style={{ fontFamily: 'var(--t-font-display, var(--font-display))', color: 'var(--t-text-muted, var(--text-secondary))' }}>
          &ldquo;{event.welcomeMessage}&rdquo;
        </p>
      </motion.div>
    </section>
  );
}
