'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);
  const successRef = useRef(false);

  // The recovery link from the email sets a temporary session once Supabase
  // parses the token out of the URL — wait for that before allowing submit,
  // otherwise updateUser() below fails with a generic "not authenticated".
  // Supabase's PKCE flow needs the ?code= param exchanged explicitly: it
  // doesn't always resolve on its own, and failed silently before this fix,
  // leaving the page stuck on "Vérification du lien..." forever.
  useEffect(() => {
    let cancelled = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true);
    });

    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const tokenHash = params.get('token_hash');
    const code = params.get('code');
    const errorDescription = params.get('error_description') || hashParams.get('error_description');

    if (errorDescription) {
      setError(decodeURIComponent(errorDescription.replace(/\+/g, ' ')));
      return;
    }

    (async () => {
      // token_hash (set via the email template) verifies server-side and
      // works even when the link is opened in a different browser/device
      // than the one that requested it — unlike the PKCE ?code= exchange
      // below, which requires the original browser's stored code_verifier.
      if (tokenHash) {
        const { error: otpError } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' });
        if (cancelled) return;
        if (otpError) {
          setError("Ce lien de réinitialisation n'est plus valide. Demandez-en un nouveau depuis la page de connexion.");
          return;
        }
        setReady(true);
        return;
      }
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;
        if (exchangeError) {
          setError("Ce lien de réinitialisation n'est plus valide. Demandez-en un nouveau depuis la page de connexion.");
          return;
        }
        setReady(true);
      }
    })();

    // The default email link uses a #access_token hash fragment, which the
    // SDK parses asynchronously on mount — give it time before concluding
    // the link is invalid, otherwise this races ahead of onAuthStateChange.
    const timeout = setTimeout(() => {
      if (!cancelled) {
        setReady(prev => {
          if (!prev) setError('Ce lien de réinitialisation est invalide ou a expiré. Demandez-en un nouveau depuis la page de connexion.');
          return prev;
        });
      }
    }, 6000);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Verifying the recovery link signs the browser in so updateUser() below
  // can work — but if the user leaves this page without finishing (closes
  // the tab, navigates to /login), that session would otherwise stick
  // around and get them silently auto-logged-in on their next visit.
  useEffect(() => {
    return () => {
      if (!successRef.current) supabase.auth.signOut();
    };
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      successRef.current = true;
      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1800);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center" style={{ minHeight: '100vh', background: 'var(--bg)', padding: '1.5rem' }}>
      <motion.div
        className="card w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link href="/login" className="flex items-center gap-2 mb-6" style={{ textDecoration: 'none' }}>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(200,169,110,0.12)', border: '1px solid rgba(200,169,110,0.2)' }}
          >
            <Sparkles size={18} style={{ color: 'var(--gold)' }} />
          </div>
          <span className="font-display text-lg font-bold" style={{ color: 'var(--text)' }}>EventOS</span>
        </Link>

        {success ? (
          <div className="text-center py-4">
            <CheckCircle2 size={40} style={{ color: '#22964F', margin: '0 auto 1rem' }} />
            <h2 className="font-display text-xl font-bold mb-2">Mot de passe mis à jour !</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Redirection vers votre tableau de bord...</p>
          </div>
        ) : (
          <>
            <h2 className="font-display text-2xl font-bold mb-1">Nouveau mot de passe</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              Choisissez un nouveau mot de passe pour votre compte
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
            {!ready && !error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 0.85rem',
                borderRadius: 10, background: 'rgba(200,169,110,0.08)', border: '1px solid rgba(200,169,110,0.15)',
                color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem',
              }}>
                <Loader2 size={14} className="animate-spin" /> Vérification du lien...
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="label" style={{ display: 'block', marginBottom: '0.5rem' }}>Nouveau mot de passe</label>
                <div className="relative">
                  <input
                    className="input pr-10"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setShowPassword(!showPassword)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="label" style={{ display: 'block', marginBottom: '0.5rem' }}>Confirmer le mot de passe</label>
                <input
                  className="input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-primary w-full py-3" disabled={loading || !ready}>
                {loading ? <><Loader2 size={16} className="animate-spin" /> Mise à jour...</> : <>Mettre à jour <ArrowRight size={16} /></>}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
