'use client';
import { useRef, useEffect } from 'react';

export default function BackgroundMusic({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = 0.3;
    audioRef.current = audio;

    // Try autoplay immediately
    audio.play().catch(() => {
      // Autoplay blocked — play on first user interaction
      const handler = () => {
        audio.play().catch(() => {});
        document.removeEventListener('click', handler);
        document.removeEventListener('touchstart', handler);
        document.removeEventListener('scroll', handler);
      };
      document.addEventListener('click', handler, { once: true });
      document.addEventListener('touchstart', handler, { once: true });
      document.addEventListener('scroll', handler, { once: true });
    });

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [url]);

  // No visible UI
  return null;
}
