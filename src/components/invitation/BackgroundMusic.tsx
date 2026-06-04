'use client';
import { useRef, useEffect } from 'react';

let globalAudio: HTMLAudioElement | null = null;

/** Call this from a user-gesture handler to start music */
export function startBackgroundMusic(url: string) {
  if (globalAudio) {
    globalAudio.pause();
    globalAudio = null;
  }
  const audio = new Audio(url);
  audio.loop = true;
  audio.volume = 0.3;
  globalAudio = audio;
  audio.play().catch(() => {});
}

export default function BackgroundMusic({ url }: { url: string }) {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;

    // Try immediate autoplay
    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = 0.3;
    globalAudio = audio;

    audio.play().then(() => {
      started.current = true;
    }).catch(() => {
      // Autoplay blocked — will be started by the intro screen click
      // Also listen for any user interaction as fallback
      const handler = () => {
        if (!started.current && globalAudio) {
          globalAudio.play().catch(() => {});
          started.current = true;
        }
        document.removeEventListener('click', handler);
        document.removeEventListener('touchstart', handler);
      };
      document.addEventListener('click', handler);
      document.addEventListener('touchstart', handler);
    });

    return () => {
      if (globalAudio) {
        globalAudio.pause();
        globalAudio = null;
      }
    };
  }, [url]);

  return null;
}
