'use client';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const loginSlides = [
  { image: '/login-wedding.png', label: 'Mariages', emoji: '💍' },
  { image: '/login-birthday.png', label: 'Anniversaires', emoji: '🎂' },
  { image: '/login-baptism.png', label: 'Baptêmes', emoji: '🕊️' },
  { image: '/login-corporate.png', label: 'Séminaires', emoji: '🏢' },
  { image: '/login-gala.png', label: 'Galas & Soirées', emoji: '🥂' },
];

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [showPassword, setShowPassword] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex(prev => (prev + 1) % loginSlides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isRegister) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });
        if (signUpError) throw signUpError;
        setSuccess('Compte créé ! Vérifiez votre email pour confirmer.');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const currentSlide = loginSlides[slideIndex];

  /* ─── Shared form content ─── */
  const formContent = (
    <>
      <h2 className="font-display text-2xl font-bold mb-1">
        {isRegister ? 'Créer un compte' : 'Bienvenue'}
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
        {isRegister ? 'Inscrivez-vous pour créer vos événements' : 'Connectez-vous à votre espace'}
      </p>

      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 0.85rem',
          borderRadius: 10, background: 'rgba(220,53,69,0.08)', border: '1px solid rgba(220,53,69,0.15)',
          color: '#DC3545', fontSize: '0.8rem', marginBottom: '1rem',
        }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}
      {success && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 0.85rem',
          borderRadius: 10, background: 'rgba(34,150,79,0.08)', border: '1px solid rgba(34,150,79,0.15)',
          color: '#22964F', fontSize: '0.8rem', marginBottom: '1rem',
        }}>
          <CheckCircle2 size={14} /> {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {isRegister && (
          <div>
            <label className="label">Nom complet</label>
            <input className="input" placeholder="Amadou Geoffroy" required value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>
        )}
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" placeholder="amadou@email.com" required value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label">Mot de passe</label>
          <div className="relative">
            <input className="input pr-10" type={showPassword ? 'text' : 'password'} placeholder="••••••••" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setShowPassword(!showPassword)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div style={{ paddingTop: '0.25rem' }}>
          <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
            {loading ? <><Loader2 size={16} className="animate-spin" /> Chargement...</> : <>{isRegister ? 'Créer mon compte' : 'Se connecter'} <ArrowRight size={16} /></>}
          </button>
        </div>
      </form>

      <div className="divider" />

      <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        {isRegister ? 'Déjà un compte ?' : "Pas encore de compte ?"}{' '}
        <button onClick={() => setIsRegister(!isRegister)} style={{ color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          {isRegister ? 'Se connecter' : "S'inscrire"}
        </button>
      </p>
    </>
  );

  /* ─── Slideshow layer (shared between mobile bg + desktop left) ─── */
  const slideshowLayer = (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={slideIndex}
          style={{
            position: 'absolute',
            inset: '-5%',
            width: '110%',
            height: '110%',
            backgroundImage: `url(${currentSlide.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
          }}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{
            opacity: 1,
            scale: [1.1, 1.0],
            transition: {
              opacity: { duration: 0.8, ease: 'easeOut' },
              scale: { duration: 5, ease: 'linear' },
            },
          }}
          exit={{
            opacity: 0,
            scale: 0.98,
            transition: { duration: 0.6, ease: 'easeIn' },
          }}
        />
      </AnimatePresence>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.5) 100%)',
        zIndex: 1,
      }} />
    </>
  );

  return (
    <>
      {/* ═══════════════ MOBILE LAYOUT ═══════════════ */}
      <div className="lg:hidden" style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
        {/* Full-screen slideshow background */}
        <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
          {slideshowLayer}
        </div>

        {/* Scrollable content on top */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '5.5rem 1.25rem 2rem',
        }}>
          {/* Logo at top */}
          <motion.div
            className="flex items-center justify-center gap-2"
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.25)',
              }}
            >
              <Sparkles size={20} color="#C8A96E" />
            </div>
            <span className="font-display text-2xl font-bold" style={{ color: '#FFFFFF' }}>
              EventOS
            </span>
          </motion.div>

          {/* White card with form */}
          <motion.div
            style={{
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '1.25rem',
              padding: '2rem 1.5rem',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              marginTop: '-1.5rem',
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {formContent}
          </motion.div>

          {/* Slide dots below card */}
          <div className="flex justify-center gap-2 mt-6">
            {loginSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlideIndex(i)}
                style={{
                  width: slideIndex === i ? 20 : 7,
                  height: 7,
                  borderRadius: 4,
                  background: slideIndex === i ? '#C8A96E' : 'rgba(255,255,255,0.4)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  padding: 0,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════ DESKTOP LAYOUT ═══════════════ */}
      <div className="hidden lg:flex min-h-screen" style={{ background: 'var(--bg)' }}>
        {/* Left panel — slideshow */}
        <div className="flex-1 relative overflow-hidden" style={{ minHeight: '100vh' }}>
          {slideshowLayer}

          {/* Content overlay */}
          <div style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '100%',
            height: '100%',
            padding: '3rem',
          }}>
            {/* Top — Logo */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <Sparkles size={20} color="#C8A96E" />
                </div>
                <span className="font-display text-xl font-bold" style={{ color: '#FFFFFF' }}>EventOS</span>
              </div>
            </motion.div>

            {/* Center — Tagline */}
            <motion.div style={{ textAlign: 'center', maxWidth: 420, margin: '0 auto' }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8 }}>
              <h1 className="font-display text-4xl font-bold mb-4" style={{ color: '#FFFFFF', lineHeight: 1.2 }}>
                La plateforme intelligente pour des événements{' '}
                <span style={{ color: '#C8A96E' }}>inoubliables</span>
              </h1>
              <p className="text-base" style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
                Gérez vos invitations, plans de table, menus et plus encore — tout en un seul endroit.
              </p>
            </motion.div>

            {/* Bottom — Slide label + dots */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
              <AnimatePresence mode="wait">
                <motion.div key={slideIndex} className="flex items-center justify-center gap-2 mb-4"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                  <span className="text-xl">{currentSlide.emoji}</span>
                  <span className="font-display text-sm font-semibold"
                    style={{ color: 'rgba(255,255,255,0.85)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {currentSlide.label}
                  </span>
                </motion.div>
              </AnimatePresence>
              <div className="flex justify-center gap-2">
                {loginSlides.map((_, i) => (
                  <button key={i} onClick={() => setSlideIndex(i)}
                    style={{
                      width: slideIndex === i ? 28 : 8, height: 8, borderRadius: 4,
                      background: slideIndex === i ? '#C8A96E' : 'rgba(255,255,255,0.35)',
                      border: 'none', cursor: 'pointer', transition: 'all 0.3s ease', padding: 0,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="flex-1 flex items-center justify-center px-6" style={{ padding: '2rem 3rem' }}>
          <motion.div className="w-full max-w-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {formContent}
          </motion.div>
        </div>
      </div>
    </>
  );
}
