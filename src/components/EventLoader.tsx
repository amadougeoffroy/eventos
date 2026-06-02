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
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles size={40} style={{ color: 'var(--gold)' }} />
        </motion.div>
      </main>
    </div>
  );
}
