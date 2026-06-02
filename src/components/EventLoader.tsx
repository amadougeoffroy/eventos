'use client';
import Sidebar from '@/components/Sidebar';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function EventLoader() {
  return (
    <div className="flex">
      <Sidebar />
      <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <motion.div
          style={{ textAlign: 'center' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            style={{ marginBottom: '1rem' }}
          >
            <Sparkles size={36} style={{ color: 'var(--gold)' }} />
          </motion.div>
          <p className="font-display text-sm" style={{ color: 'var(--text-muted)' }}>
            Chargement de l&apos;événement…
          </p>
        </motion.div>
      </main>
    </div>
  );
}
