'use client';
import { motion } from 'framer-motion';

export default function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <motion.div
        className="text-3xl md:text-5xl font-bold font-display"
        key={value}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{ color: '#FFFFFF' }}
      >
        {String(value).padStart(2, '0')}
      </motion.div>
      <div className="text-xs md:text-sm mt-1 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</div>
    </div>
  );
}
