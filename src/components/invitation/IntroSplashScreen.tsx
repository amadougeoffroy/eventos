'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Event } from '@/lib/types';

interface IntroSplashScreenProps {
  event: Event;
  onEnter: () => void;
}

export default function IntroSplashScreen({ event, onEnter }: IntroSplashScreenProps) {
  // Extract couple / celebrant names cleanly
  const { subtitle, person1, person2, singleTitle } = useMemo(() => {
    const isWedding = event.type === 'wedding';
    const groom = event.meta?.groomName;
    const bride = event.meta?.brideName;

    if (isWedding) {
      if (groom && bride) {
        return { subtitle: 'Le mariage de', person1: groom, person2: bride, singleTitle: null };
      }
      // Check if event.name contains " et " or " & "
      const cleaned = event.name.replace(/^(mariage|célébration)\s+de\s+/i, '');
      const parts = cleaned.includes(' et ')
        ? cleaned.split(/\s+et\s+/i)
        : cleaned.includes(' & ')
        ? cleaned.split(/\s+&\s+/i)
        : null;

      if (parts && parts.length >= 2) {
        return {
          subtitle: 'Le mariage de',
          person1: parts[0].trim(),
          person2: parts.slice(1).join(' & ').trim(),
          singleTitle: null,
        };
      }
      return { subtitle: 'Le mariage de', person1: null, person2: null, singleTitle: event.name };
    }

    if (event.type === 'birthday') {
      const celebrant = event.meta?.celebrantName;
      const age = event.meta?.age;
      return {
        subtitle: age ? `Les ${age} ans de` : "L'anniversaire de",
        person1: null,
        person2: null,
        singleTitle: celebrant || event.name,
      };
    }

    return { subtitle: 'Célébration', person1: null, person2: null, singleTitle: event.name };
  }, [event]);

  // Formatted date
  const formattedDate = useMemo(() => {
    if (!event.date) return '';
    try {
      const d = new Date(event.date + 'T12:00:00');
      const str = d.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      return str.charAt(0).toUpperCase() + str.slice(1);
    } catch {
      return event.date;
    }
  }, [event.date]);

  return (
    <motion.div
      className="intro-splash-container"
      onClick={onEnter}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8 } }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Cormorant:ital@1&family=Jost:wght@400;500;600&display=swap');

        .intro-splash-container {
          --ivoire: #FBF6EE;
          --ivoire-carte: #FFFDF9;
          --encre: #2B2420;
          --encre-douce: #6B6055;
          --or: #B8863C;
          --or-clair: #D9AE6C;
          --or-fonce: #96692A;
          --or-fond: #F3E4C6;
          --trait: #E7DCC5;

          position: fixed;
          inset: 0;
          width: 100vw;
          min-height: 100vh;
          height: 100%;
          z-index: 99999;
          font-family: 'Jost', sans-serif;
          color: var(--encre);
          background:
            radial-gradient(ellipse at top left, #FFFDF8 0%, transparent 55%),
            radial-gradient(ellipse at bottom right, #F6EEDD 0%, transparent 55%),
            var(--ivoire);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          cursor: pointer;
        }

        .intro-splash-container::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, #E7DCC5 1px, transparent 1px);
          background-size: 26px 26px;
          opacity: 0.5;
          pointer-events: none;
        }

        .intro-scene {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 60px 30px;
          z-index: 2;
          max-width: 900px;
          width: 100%;
        }

        .intro-cercles {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 1px;
          height: 1px;
          pointer-events: none;
        }

        .intro-cercle {
          position: absolute;
          top: 50%;
          left: 50%;
          border-radius: 50%;
          border: 1px solid var(--trait);
          transform: translate(-50%, -50%);
          animation: introRespirer 7s ease-in-out infinite;
        }

        .intro-cercle.c1 { width: 260px; height: 260px; animation-delay: 0s; }
        .intro-cercle.c2 { width: 420px; height: 420px; animation-delay: .6s; opacity: .75; }
        .intro-cercle.c3 { width: 600px; height: 600px; animation-delay: 1.2s; opacity: .5; }

        @keyframes introRespirer {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: .6; }
          50% { transform: translate(-50%, -50%) scale(1.03); opacity: 1; }
        }

        .intro-monogramme {
          position: relative;
          width: 88px;
          height: 88px;
          margin-bottom: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .intro-monogramme svg {
          width: 100%;
          height: 100%;
        }

        .intro-eyebrow {
          font-size: 12px;
          letter-spacing: .28em;
          color: var(--or);
          font-weight: 500;
          text-transform: uppercase;
          margin-bottom: 18px;
        }

        .intro-scene h1 {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 600;
          font-style: italic;
          font-size: 26px;
          color: var(--encre-douce);
          margin-bottom: 4px;
        }

        .intro-noms {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 700;
          font-size: 64px;
          line-height: 1.05;
          color: var(--encre);
          margin-bottom: 18px;
          display: flex;
          align-items: center;
          gap: 18px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .intro-noms .intro-et {
          font-style: italic;
          font-weight: 500;
          font-size: 34px;
          color: var(--or);
        }

        .intro-trait-date {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 36px;
        }

        .intro-trait-date .intro-ligne {
          width: 36px;
          height: 1px;
          background: var(--or-clair);
        }

        .intro-date {
          font-size: 15px;
          letter-spacing: .05em;
          color: var(--encre-douce);
          font-weight: 400;
        }

        .intro-date strong {
          color: var(--encre);
          font-weight: 500;
        }

        .intro-btn-ouvrir {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: linear-gradient(180deg, #D3A55C, var(--or));
          color: #FFFBF2 !important;
          border: none;
          padding: 17px 40px;
          border-radius: 999px;
          font-family: 'Jost', sans-serif;
          font-size: 15px;
          font-weight: 500;
          letter-spacing: .02em;
          cursor: pointer;
          box-shadow:
            0 14px 26px -10px rgba(184,134,60,0.55),
            0 2px 0 rgba(255,255,255,0.4) inset;
          transition: transform .18s ease, box-shadow .18s ease;
        }

        .intro-btn-ouvrir:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 30px -10px rgba(184,134,60,0.65), 0 2px 0 rgba(255,255,255,0.4) inset;
        }

        .intro-btn-ouvrir svg {
          width: 15px;
          height: 15px;
        }

        .intro-scroll-cue {
          margin-top: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          color: var(--or);
          animation: introDescendre 2s ease-in-out infinite;
        }

        .intro-scroll-cue svg {
          width: 18px;
          height: 18px;
        }

        .intro-music-note {
          margin-top: 18px;
          font-size: 12px;
          letter-spacing: .04em;
          color: var(--encre-douce);
          opacity: 0.75;
        }

        @keyframes introDescendre {
          0%, 100% { transform: translateY(0); opacity: .5; }
          50% { transform: translateY(6px); opacity: 1; }
        }

        @media (max-width: 600px) {
          .intro-noms { font-size: 42px; gap: 10px; }
          .intro-noms .intro-et { font-size: 24px; }
          .intro-cercle.c2, .intro-cercle.c3 { display: none; }
          .intro-scene { padding: 40px 20px; }
          .intro-btn-ouvrir { padding: 15px 32px; font-size: 14px; }
        }
      `}</style>

      <div className="intro-scene">
        {/* Cercles concentriques animés */}
        <div className="intro-cercles">
          <div className="intro-cercle c1" />
          <div className="intro-cercle c2" />
          <div className="intro-cercle c3" />
        </div>

        {/* Monogramme / Anneaux entrelacés */}
        <motion.div
          className="intro-monogramme"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <svg viewBox="0 0 100 100" fill="none">
            <circle cx="38" cy="58" r="19" stroke="#D9AE6C" strokeWidth="2.2" />
            <circle cx="62" cy="58" r="19" stroke="#B8863C" strokeWidth="2.2" />
            <path
              d="M50 18 L54 30 L66 30 L56 37 L60 49 L50 41.5 L40 49 L44 37 L34 30 L46 30 Z"
              fill="#B8863C"
              opacity="0.9"
            />
          </svg>
        </motion.div>

        {/* Eyebrow */}
        <motion.p
          className="intro-eyebrow"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Vous êtes invité(e)
        </motion.p>

        {/* Titre / Sous-titre */}
        <motion.h1
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.6 }}
        >
          {subtitle}
        </motion.h1>

        {/* Noms */}
        <motion.div
          className="intro-noms"
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.7 }}
        >
          {person1 && person2 ? (
            <>
              {person1} <span className="intro-et">&</span> {person2}
            </>
          ) : (
            singleTitle
          )}
        </motion.div>

        {/* Date */}
        {formattedDate && (
          <motion.div
            className="intro-trait-date"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65, duration: 0.6 }}
          >
            <span className="intro-ligne" />
            <span className="intro-date">{formattedDate}</span>
            <span className="intro-ligne" />
          </motion.div>
        )}

        {/* Bouton Ouvrir */}
        <motion.button
          type="button"
          className="intro-btn-ouvrir"
          onClick={(e) => {
            e.stopPropagation();
            onEnter();
          }}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          Ouvrir l&apos;invitation
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </motion.button>

        {/* Scroll Cue Arrow */}
        <motion.div
          className="intro-scroll-cue"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </motion.div>

        {/* Musique d'ambiance */}
        {event.backgroundMusicUrl && (
          <motion.p
            className="intro-music-note"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            🎵 Avec musique d&apos;ambiance
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}
