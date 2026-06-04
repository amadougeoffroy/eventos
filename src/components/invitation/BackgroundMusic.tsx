'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Volume2 } from 'lucide-react';

export default function BackgroundMusic({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const triedAutoplay = useRef(false);

  const startPlayback = useCallback(() => {
    if (!audioRef.current || playing) return;
    audioRef.current.play().then(() => {
      setPlaying(true);
      setShowHint(false);
    }).catch(() => { /* blocked, will retry on interaction */ });
  }, [playing]);

  useEffect(() => {
    audioRef.current = new Audio(url);
    audioRef.current.loop = true;
    audioRef.current.volume = 0.3;

    // Attempt autoplay
    if (!triedAutoplay.current) {
      triedAutoplay.current = true;
      audioRef.current.play().then(() => {
        setPlaying(true);
        setShowHint(false);
      }).catch(() => {
        // Autoplay blocked — play on first user interaction
        const handler = () => {
          startPlayback();
          document.removeEventListener('click', handler);
          document.removeEventListener('touchstart', handler);
          document.removeEventListener('scroll', handler);
        };
        document.addEventListener('click', handler, { once: true });
        document.addEventListener('touchstart', handler, { once: true });
        document.addEventListener('scroll', handler, { once: true });
      });
    }

    const t = setTimeout(() => setShowHint(false), 6000);

    return () => {
      clearTimeout(t);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
            🎵 {playing ? 'Musique en cours' : 'Cliquez pour la musique'}
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
