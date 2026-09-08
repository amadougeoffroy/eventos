'use client';
import { Event } from '@/lib/types';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Clock, MapPin } from 'lucide-react';
import CountdownUnit from './CountdownUnit';

interface HeroSlideshowProps {
  event: Event;
  heroSlides?: string[];
  heroVideo?: string;
  cfg: { emoji: string; label: string; color: string };
}

export default function HeroSlideshow({ event, cfg }: HeroSlideshowProps) {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Countdown timer
  useEffect(() => {
    const target = new Date(event.date + 'T' + event.time).getTime();
    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [event]);

  const handleOpen = () => {
    const el = document.getElementById('invitation-details');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
    }
  };

  const isWedding = event.type === 'wedding';
  const groom = event.meta?.groomName || 'Frankie';
  const bride = event.meta?.brideName || 'Mingue';

  // Format date in French: e.g. "Vendredi 4 décembre 2026"
  const formattedDate = event.date
    ? new Date(event.date + 'T12:00:00').toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Vendredi 4 décembre 2026';
  const displayDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <section style={{ position: 'relative' }}>
      <style>{`
        :root {
          --ivoire: #FBF6EE;
          --ivoire-carte: #FFFDF9;
          --encre: #2B2420;
          --encre-douce: #6B6055;
          --or: #B8863C;
          --or-clair: #D9AE6C;
          --or-fonce: #96692A;
          --or-fond: #F3E4C6;
          --trait: #E7DCC5;
        }

        .hero-scene-root {
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
          position: relative;
          min-height: 100vh;
          min-height: 100dvh;
          width: 100%;
        }

        /* texture point fin en fond */
        .hero-scene-root::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, #E7DCC5 1px, transparent 1px);
          background-size: 26px 26px;
          opacity: 0.5;
          pointer-events: none;
        }

        .scene {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 60px 30px;
          z-index: 2;
        }

        /* cercles concentriques animés, doux */
        .cercles {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 1px;
          height: 1px;
          pointer-events: none;
          z-index: 1;
        }
        .cercle {
          position: absolute;
          top: 50%;
          left: 50%;
          border-radius: 50%;
          border: 1px solid var(--trait);
          transform: translate(-50%, -50%);
          animation: respirer 7s ease-in-out infinite;
        }
        .cercle.c1 { width: 260px; height: 260px; animation-delay: 0s; }
        .cercle.c2 { width: 420px; height: 420px; animation-delay: 0.6s; opacity: 0.75; }
        .cercle.c3 { width: 600px; height: 600px; animation-delay: 1.2s; opacity: 0.5; }

        @keyframes respirer {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
          50% { transform: translate(-50%, -50%) scale(1.03); opacity: 1; }
        }

        /* monogramme / anneaux entrelacés en line-art doré */
        .monogramme {
          position: relative;
          width: 88px;
          height: 88px;
          margin-bottom: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .monogramme svg { width: 100%; height: 100%; }

        .eyebrow {
          font-size: 12px;
          letter-spacing: 0.28em;
          color: var(--or);
          font-weight: 500;
          text-transform: uppercase;
          margin-bottom: 18px;
        }

        .titre-mariage {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 600;
          font-style: italic;
          font-size: 26px;
          color: var(--encre-douce);
          margin-bottom: 4px;
        }

        .noms {
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
        .noms .et {
          font-style: italic;
          font-weight: 500;
          font-size: 34px;
          color: var(--or);
        }

        .trait-date {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 36px;
        }
        .trait-date .ligne { width: 36px; height: 1px; background: var(--or-clair); }
        .date {
          font-size: 15px;
          letter-spacing: 0.05em;
          color: var(--encre-douce);
          font-weight: 400;
        }
        .date strong { color: var(--encre); font-weight: 500; }

        .btn-ouvrir {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: linear-gradient(180deg, #D3A55C, var(--or));
          color: #FFFBF2;
          border: none;
          padding: 17px 40px;
          border-radius: 999px;
          font-family: 'Jost', sans-serif;
          font-size: 15px;
          font-weight: 500;
          letter-spacing: 0.02em;
          cursor: pointer;
          box-shadow:
            0 14px 26px -10px rgba(184, 134, 60, 0.55),
            0 2px 0 rgba(255, 255, 255, 0.4) inset;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .btn-ouvrir:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 30px -10px rgba(184, 134, 60, 0.65), 0 2px 0 rgba(255, 255, 255, 0.4) inset;
        }
        .btn-ouvrir svg { width: 15px; height: 15px; }

        .scroll-cue {
          margin-top: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          color: var(--or);
          background: none;
          border: none;
          cursor: pointer;
          animation: descendre 2s ease-in-out infinite;
        }
        .scroll-cue svg { width: 18px; height: 18px; }

        @keyframes descendre {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(6px); opacity: 1; }
        }

        @media (max-width: 600px) {
          .noms { font-size: 42px; gap: 10px; }
          .noms .et { font-size: 24px; }
          .cercle.c2, .cercle.c3 { display: none; }
          .scene { padding: 40px 20px; }
        }
      `}</style>

      {/* ── Scène d'accueil poétique (100vh) ── */}
      <div className="hero-scene-root">
        <div className="scene">
          <div className="cercles">
            <div className="cercle c1" />
            <div className="cercle c2" />
            <div className="cercle c3" />
          </div>

          <motion.div
            className="monogramme"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
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

          <motion.p
            className="eyebrow"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Vous êtes invité(e)
          </motion.p>

          <motion.h1
            className="titre-mariage"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
          >
            {isWedding ? 'Le mariage de' : cfg.label}
          </motion.h1>

          <motion.div
            className="noms"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            {isWedding && groom && bride ? (
              <>{groom} <span className="et">&</span> {bride}</>
            ) : (
              <>{event.meta?.celebrantName || event.name}</>
            )}
          </motion.div>

          <motion.div
            className="trait-date"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            <span className="ligne" />
            <span className="date">{displayDate}</span>
            <span className="ligne" />
          </motion.div>

          <motion.button
            className="btn-ouvrir"
            onClick={handleOpen}
            type="button"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.6 }}
          >
            Ouvrir l&apos;invitation
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </motion.button>

          <motion.button
            className="scroll-cue"
            onClick={handleOpen}
            type="button"
            aria-label="Défiler"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.6 }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </motion.button>
        </div>
      </div>

      {/* ── Détails & Compte à rebours ci-dessous ── */}
      <div
        id="invitation-details"
        style={{
          background: 'var(--t-bg, #FFFFFF)',
          textAlign: 'center',
          padding: '3rem 1.5rem 3.5rem',
          borderTop: '1px solid var(--trait, #E7DCC5)',
        }}
      >
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <div
            className="eyebrow"
            style={{ marginBottom: '1rem', color: 'var(--or, #B8863C)' }}
          >
            {isWedding ? 'Bienvenue à notre célébration' : 'Informations & Compte à rebours'}
          </div>

          <div
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: 'italic',
              fontSize: '1.1rem',
              color: 'var(--encre-douce, #6B6055)',
              marginBottom: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              alignItems: 'center',
            }}
          >
            <span className="flex items-center justify-center gap-2">
              <CalendarDays size={16} style={{ color: 'var(--or, #B8863C)' }} /> {displayDate}
              <span style={{ margin: '0 0.4rem', opacity: 0.5 }}>•</span>
              <Clock size={16} style={{ color: 'var(--or, #B8863C)' }} /> {event.time}
            </span>
            {event.venue && (
              <span className="flex items-center justify-center gap-2" style={{ color: 'var(--encre, #2B2420)', fontWeight: 500 }}>
                <MapPin size={16} style={{ color: 'var(--or, #B8863C)' }} /> {event.venue}
              </span>
            )}
          </div>

          {/* Compte à rebours */}
          <motion.div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              background: 'linear-gradient(135deg, #B8863C, #D9AE6C)',
              padding: '1.25rem 2rem',
              borderRadius: '1rem',
              boxShadow: '0 12px 28px -10px rgba(184,134,60,0.45)',
            }}
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
          >
            <CountdownUnit value={countdown.days} label="Jours" />
            <div className="text-xl font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>:</div>
            <CountdownUnit value={countdown.hours} label="Heures" />
            <div className="text-xl font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>:</div>
            <CountdownUnit value={countdown.minutes} label="Min" />
            <div className="text-xl font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>:</div>
            <CountdownUnit value={countdown.seconds} label="Sec" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
