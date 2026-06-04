'use client';
import { Event } from '@/lib/types';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronLeft, ChevronRight, CalendarDays, Clock, MapPin } from 'lucide-react';
import CountdownUnit from './CountdownUnit';

interface HeroSlideshowProps {
  event: Event;
  heroSlides: string[];
  cfg: { emoji: string; label: string; color: string };
}

export default function HeroSlideshow({ event, heroSlides, cfg }: HeroSlideshowProps) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Auto-advance slides every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex(prev => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const prevSlide = useCallback(() => {
    setSlideIndex(prev => (prev - 1 + heroSlides.length) % heroSlides.length);
  }, [heroSlides.length]);

  const nextSlide = useCallback(() => {
    setSlideIndex(prev => (prev + 1) % heroSlides.length);
  }, [heroSlides.length]);

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

  const heroTitle = event.type === 'wedding' && event.meta.groomName && event.meta.brideName
    ? `${event.meta.groomName} & ${event.meta.brideName}`
    : event.type === 'birthday' && event.meta.celebrantName && event.meta.age
    ? `Les ${event.meta.age} ans de ${event.meta.celebrantName}`
    : event.name;

  return (
    <section style={{ position: 'relative' }}>
      {/* Photo area — full viewport height */}
      <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
        {/* Slideshow photos — Ken Burns effect */}
        <AnimatePresence mode="wait">
          <motion.div
            key={slideIndex}
            style={{
              position: 'absolute', inset: '-5%', width: '110%', height: '110%',
              backgroundImage: `url(${heroSlides[slideIndex]})`,
              backgroundSize: 'cover', backgroundPosition: 'center center',
            }}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{
              opacity: 1,
              scale: [1.1, 1.0],
              transition: {
                opacity: { duration: 0.8, ease: 'easeOut' },
                scale: { duration: 6, ease: 'linear' },
              },
            }}
            exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.6, ease: 'easeIn' } }}
          />
        </AnimatePresence>

        {/* Dark overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'var(--t-hero-overlay, linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.6) 100%))',
        }} />

        {/* Bottom gradient fade */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
          background: `linear-gradient(to bottom, transparent 0%, color-mix(in srgb, var(--t-bg, #FFFFFF) 40%, transparent) 50%, color-mix(in srgb, var(--t-bg, #FFFFFF) 85%, transparent) 75%, var(--t-bg, #FFFFFF) 100%)`,
          zIndex: 2,
        }} />

        {/* Content overlay */}
        <motion.div
          style={{
            position: 'relative', zIndex: 3, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'space-between', height: '100%', padding: '3rem 1.5rem',
          }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }}
        >
          {/* Top: icon + event type */}
          <motion.div
            style={{ textAlign: 'center', paddingTop: '1rem' }}
            initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
          >
            {event.type === 'wedding' ? (
              <div style={{ margin: '0 auto 0.75rem' }}>
                <svg width="40" height="40" viewBox="0 0 48 48" fill="none" style={{ margin: '0 auto' }}>
                  <circle cx="18" cy="24" r="10" stroke="var(--t-accent, #C8A96E)" strokeWidth="2" fill="none" />
                  <circle cx="30" cy="24" r="10" stroke="var(--t-accent, #C8A96E)" strokeWidth="2" fill="none" />
                </svg>
              </div>
            ) : (
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{cfg.emoji}</div>
            )}
            <div className="font-body" style={{
              fontSize: '0.7rem', letterSpacing: '0.25em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.85)', fontWeight: 500,
            }}>
              {event.type === 'wedding' ? 'Célébration de Mariage' : cfg.label}
            </div>
          </motion.div>

          {/* Center: "Invitation" */}
          <motion.div
            style={{ textAlign: 'center' }}
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6, duration: 0.8 }}
          >
            <h1 className="font-script" style={{
              fontSize: 'clamp(4.5rem, 14vw, 7.5rem)', color: '#FFFFFF',
              fontWeight: 400, lineHeight: 1, textShadow: '0 2px 20px rgba(0,0,0,0.3)',
            }}>
              Invitation
            </h1>
          </motion.div>

          {/* Bottom: scroll hint */}
          <motion.div
            style={{ textAlign: 'center', paddingBottom: '1rem', zIndex: 5 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
          >
            <div className="font-body" style={{
              fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase',
              color: 'rgba(100,90,80,0.6)', marginBottom: '0.5rem',
            }}>Défiler</div>
            <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity }}>
              <ChevronDown size={22} style={{ color: 'rgba(100,90,80,0.5)', margin: '0 auto' }} />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Slide navigation arrows */}
        {heroSlides.length > 1 && (
          <>
            <button onClick={prevSlide} aria-label="Photo précédente" style={{
              position: 'absolute', left: '0.75rem', top: '45%', transform: 'translateY(-50%)', zIndex: 10,
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.25)', color: '#FFFFFF',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease',
            }}><ChevronLeft size={22} /></button>
            <button onClick={nextSlide} aria-label="Photo suivante" style={{
              position: 'absolute', right: '0.75rem', top: '45%', transform: 'translateY(-50%)', zIndex: 10,
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.25)', color: '#FFFFFF',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease',
            }}><ChevronRight size={22} /></button>
          </>
        )}

        {/* Slide indicator dots */}
        {heroSlides.length > 1 && (
          <div style={{
            position: 'absolute', bottom: '11rem', left: '50%', transform: 'translateX(-50%)',
            zIndex: 10, display: 'flex', gap: '0.5rem',
          }}>
            {heroSlides.map((_, i) => (
              <button
                key={i} onClick={() => setSlideIndex(i)} aria-label={`Photo ${i + 1}`}
                style={{
                  width: slideIndex === i ? 24 : 8, height: 8, borderRadius: 4,
                  background: slideIndex === i ? 'var(--t-accent, #C8A96E)' : 'rgba(255,255,255,0.5)',
                  border: 'none', cursor: 'pointer', transition: 'all 0.3s ease', padding: 0,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Names + Details below fade */}
      <div style={{ background: 'var(--t-bg, #FFFFFF)', textAlign: 'center', padding: '2rem 1.5rem 3rem', marginTop: '-1px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <div className="font-body" style={{
            fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase',
            color: 'var(--t-text-muted, var(--text-muted))', marginBottom: '1.5rem',
          }}>
            {event.type === 'wedding' ? 'Bienvenue à notre célébration' : 'Vous êtes invité(e) à'}
          </div>

          <h2 className="font-display" style={{
            fontSize: 'clamp(2.5rem, 7vw, 4rem)', fontWeight: 700,
            color: 'var(--t-text, var(--text))', lineHeight: 1.2, marginBottom: '0.5rem',
          }}>
            {event.type === 'wedding' && event.meta.groomName && event.meta.brideName ? (
              <>{event.meta.groomName}<br /><span className="font-script" style={{ color: 'var(--t-accent, var(--gold))', fontSize: '0.6em', fontWeight: 400 }}>&</span><br />{event.meta.brideName}</>
            ) : heroTitle}
          </h2>

          <div className="font-display italic" style={{ fontSize: '1rem', color: 'var(--t-text-muted, var(--text-secondary))', marginTop: '1.5rem', marginBottom: '2rem' }}>
            <span className="flex items-center justify-center gap-1.5" style={{ marginBottom: '0.25rem' }}>
              <CalendarDays size={15} /> {new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              <span style={{ margin: '0 0.5rem' }}>•</span>
              <Clock size={15} /> {event.time}
            </span>
            <span className="flex items-center justify-center gap-1.5">
              <MapPin size={15} /> {event.venue}
            </span>
          </div>

          {/* Countdown */}
          <motion.div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '1rem',
            background: 'linear-gradient(135deg, var(--t-accent, #C8A96E), var(--t-accent, #D4B87A))',
            padding: '1.25rem 2rem', borderRadius: '1rem',
          }} initial={{ scale: 0.9, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }}>
            <CountdownUnit value={countdown.days} label="Jours" />
            <div className="text-xl font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>:</div>
            <CountdownUnit value={countdown.hours} label="Heures" />
            <div className="text-xl font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>:</div>
            <CountdownUnit value={countdown.minutes} label="Min" />
            <div className="text-xl font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>:</div>
            <CountdownUnit value={countdown.seconds} label="Sec" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
