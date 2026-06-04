'use client';
import { Event } from '@/lib/types';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircleHeart, Send } from 'lucide-react';

export default function SectionSweetMessage({ event, guestName }: { event: Event; guestName: string }) {
  const [sweetMessage, setSweetMessage] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <section style={{ background: 'var(--t-bg, var(--bg))', padding: '5rem 1.5rem' }}>
      <div style={{ maxWidth: 512, margin: '0 auto' }}>
        <motion.div
          style={{ textAlign: 'center', marginBottom: '2rem' }}
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        >
          <MessageCircleHeart size={32} style={{ color: 'var(--t-accent, var(--gold))', margin: '0 auto 1rem' }} />
          <h2 className="font-display text-3xl font-bold mb-2">
            Un petit <span className="gradient-gold">mot doux</span>
          </h2>
          <p className="text-sm" style={{ color: 'var(--t-text-muted, var(--text-muted))' }}>
            Laissez un message personnel aux organisateurs
          </p>
        </motion.div>

        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <AnimatePresence mode="wait">
            {!sent ? (
              <motion.div
                key="sweet-form"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }}
              >
                <textarea
                  className="input"
                  rows={4}
                  placeholder="Vos vœux de bonheur, une anecdote, un souvenir partagé..."
                  value={sweetMessage}
                  onChange={e => setSweetMessage(e.target.value)}
                  style={{ resize: 'none', marginBottom: '1rem' }}
                />
                <button
                  className="btn-primary w-full py-3"
                  onClick={async () => {
                    if (!sweetMessage.trim()) return;
                    try {
                      const { createClient } = await import('@/lib/supabase/client');
                      const supabase = createClient();
                      await supabase.from('sweet_messages').insert({
                        event_id: event.id,
                        author_name: guestName || 'Anonyme',
                        message: sweetMessage.trim(),
                      });
                    } catch (e) {
                      console.warn('Sweet message save failed:', e);
                    }
                    setSent(true);
                  }}
                  disabled={!sweetMessage.trim()}
                  style={{ opacity: !sweetMessage.trim() ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <Send size={16} />
                  Envoyer mon message
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="sweet-success"
                className="text-center py-6"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              >
                <motion.div
                  className="text-5xl mb-3"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5 }}
                >
                  💌
                </motion.div>
                <h3 className="font-display text-xl font-bold mb-2">Merci pour ce beau message !</h3>
                <p className="text-sm" style={{ color: 'var(--t-text-muted, var(--text-muted))' }}>Votre mot a été transmis aux organisateurs avec amour.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
