'use client';
import { Event } from '@/lib/types';
import { motion } from 'framer-motion';
import { Gift } from 'lucide-react';

export default function SectionGiftList({ event }: { event: Event }) {
  return (
    <section style={{ background: 'var(--t-bg-warm, var(--bg-section))', padding: '5rem 1.5rem' }}>
      <div style={{ maxWidth: 512, margin: '0 auto' }}>
        <motion.div
          style={{ textAlign: 'center', marginBottom: '2rem' }}
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

        <motion.div
          className="card glass-gold"
          style={{ textAlign: 'center', padding: '2.5rem 2rem' }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎁</div>
          <p style={{ fontSize: '1rem', lineHeight: 1.7, color: 'var(--t-text, var(--text))', marginBottom: '1.5rem' }}>
            Si vous souhaitez nous gâter, nous avons préparé une petite sélection pour vous inspirer.
          </p>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.75rem 1.5rem', borderRadius: 'var(--t-radius, 12px)',
            background: 'linear-gradient(135deg, var(--t-accent, var(--gold)), var(--t-accent, var(--gold-light)))',
            color: '#fff', fontWeight: 600, fontSize: '0.9rem',
          }}>
            <Gift size={16} />
            Voir la liste
          </div>
        </motion.div>
      </div>
    </section>
  );
}
