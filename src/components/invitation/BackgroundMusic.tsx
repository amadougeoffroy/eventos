'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Volume2 } from 'lucide-react';

export default function BackgroundMusic({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    audioRef.current = new Audio(url);
    audioRef.current.loop = true;
    audioRef.current.volume = 0.3;

    const t = setTimeout(() => setShowHint(false), 5000);

    return () => {
      clearTimeout(t);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [url]);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setPlaying(!playing);
    setShowHint(false);
  };

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
      display: 'flex', alignItems: 'center', gap: '0.5rem',
    }}>
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            style={{
              padding: '0.5rem 0.75rem', borderRadius: 20,
              background: 'var(--t-card-bg, rgba(255,255,255,0.9))',
              backdropFilter: 'blur(12px)',
              border: '1px solid var(--t-card-border, rgba(0,0,0,0.06))',
              fontSize: '0.7rem', color: 'var(--t-text-muted, var(--text-muted))',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            }}
          >
            🎵 Musique d&apos;ambiance
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        onClick={toggle}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        style={{
          width: 48, height: 48, borderRadius: '50%',
          background: playing
            ? 'linear-gradient(135deg, var(--t-accent, var(--gold)), var(--t-accent, var(--gold-light)))'
            : 'var(--t-card-bg, rgba(255,255,255,0.9))',
          backdropFilter: 'blur(12px)',
          border: `1px solid ${playing ? 'transparent' : 'var(--t-card-border, rgba(0,0,0,0.06))'}`,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          color: playing ? '#fff' : 'var(--t-accent, var(--gold))',
        }}
      >
        {playing ? (
          <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}>
            <Volume2 size={20} />
          </motion.div>
        ) : (
          <Music size={20} />
        )}
      </motion.button>
    </div>
  );
}
