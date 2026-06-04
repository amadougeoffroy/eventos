'use client';
import { useMemo } from 'react';
import { motion } from 'framer-motion';

export default function ParticleSystem({ type }: { type: string }) {
  const particles = useMemo(() => Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: ((i * 37 + 13) % 100),
    y: ((i * 23 + 7) % 100),
    size: ((i * 7 + 3) % 8) + 4,
    duration: ((i * 11 + 5) % 6) + 4,
    delay: ((i * 17 + 2) % 4),
    xDrift: ((i * 13) % 60) - 30,
    emoji: type === 'petals' ? (i % 3 === 0 ? '🌸' : i % 3 === 1 ? '💮' : '🌺')
         : type === 'balloons' ? (i % 3 === 0 ? '🎈' : i % 3 === 1 ? '🎉' : '🎊')
         : type === 'doves' ? '🕊️'
         : type === 'hearts' ? '💕'
         : type === 'stars' ? (i % 2 === 0 ? '✨' : '⭐')
         : '✨',
  })), [type]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{ left: `${p.x}%`, top: `${p.y}%`, fontSize: p.size }}
          animate={{
            y: [0, -200, -400],
            x: [0, p.xDrift],
            opacity: [0, 0.7, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeOut',
          }}
        >
          {p.emoji}
        </motion.div>
      ))}
    </div>
  );
}
