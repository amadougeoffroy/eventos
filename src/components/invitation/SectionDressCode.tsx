'use client';
import { Event } from '@/lib/types';
import { motion } from 'framer-motion';

export default function SectionDressCode({ event }: { event: Event }) {
  if (!event.dressCode) return null;
  return (
    <section style={{ background: 'var(--t-bg, var(--bg))', padding: '4rem 1.5rem' }}>
      <motion.div
        className="card glass-gold"
        style={{ maxWidth: 448, margin: '0 auto', textAlign: 'center' }}
        initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
      >
        <div className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--t-accent, var(--gold))' }}>Dress Code</div>
        <p className="text-lg">{event.dressCode}</p>
        <div className="flex items-center justify-center gap-3 mt-4">
          <div className="w-8 h-8 rounded-full border-2" style={{ background: event.primaryColor, borderColor: 'rgba(0,0,0,0.1)' }} />
          <div className="w-8 h-8 rounded-full border-2" style={{ background: event.secondaryColor, borderColor: 'rgba(0,0,0,0.1)' }} />
        </div>
      </motion.div>
    </section>
  );
}
