'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  icon?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title = 'Confirmation',
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'danger',
  icon,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const variantStyles = {
    danger: {
      iconBg: 'rgba(248,113,113,0.12)',
      iconBorder: 'rgba(248,113,113,0.25)',
      iconColor: '#F87171',
      btnBg: 'linear-gradient(135deg, #EF4444, #DC2626)',
      btnHover: '#DC2626',
    },
    warning: {
      iconBg: 'rgba(251,191,36,0.12)',
      iconBorder: 'rgba(251,191,36,0.25)',
      iconColor: '#FBBF24',
      btnBg: 'linear-gradient(135deg, #F59E0B, #D97706)',
      btnHover: '#D97706',
    },
    default: {
      iconBg: 'rgba(200,169,110,0.12)',
      iconBorder: 'rgba(200,169,110,0.25)',
      iconColor: 'var(--gold)',
      btnBg: 'linear-gradient(135deg, var(--gold), var(--gold-light))',
      btnHover: 'var(--gold)',
    },
  };

  const vs = variantStyles[variant];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              borderRadius: '1.25rem',
              padding: '2rem',
              width: '100%',
              maxWidth: 400,
              border: '1px solid var(--border-light)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.05) inset',
            }}
          >
            {/* Close button */}
            <button
              onClick={onCancel}
              style={{
                position: 'absolute', top: '1rem', right: '1rem',
                background: 'none', border: 'none', padding: 4,
                cursor: 'pointer', color: 'var(--text-muted)',
                borderRadius: 6, transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <X size={18} />
            </button>

            {/* Icon */}
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 20 }}
                style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: vs.iconBg, border: `1px solid ${vs.iconBorder}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto',
                }}
              >
                {icon || <AlertTriangle size={26} style={{ color: vs.iconColor }} />}
              </motion.div>
            </div>

            {/* Title */}
            <h3
              className="font-display"
              style={{
                textAlign: 'center', fontSize: '1.15rem',
                fontWeight: 700, margin: '0 0 0.5rem',
                color: 'var(--text-primary)',
              }}
            >{title}</h3>

            {/* Message */}
            <p style={{
              textAlign: 'center', fontSize: '0.85rem',
              color: 'var(--text-muted)', lineHeight: 1.5,
              margin: '0 0 1.75rem', padding: '0 0.5rem',
            }}>{message}</p>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <button
                onClick={onCancel}
                style={{
                  flex: 1, padding: '0.7rem', borderRadius: 12,
                  border: '1px solid var(--border-light)',
                  background: 'var(--glass)', color: 'var(--text-secondary)',
                  fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--bg-card)';
                  e.currentTarget.style.borderColor = 'var(--text-muted)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'var(--glass)';
                  e.currentTarget.style.borderColor = 'var(--border-light)';
                }}
              >{cancelLabel}</button>
              <button
                onClick={onConfirm}
                style={{
                  flex: 1, padding: '0.7rem', borderRadius: 12,
                  border: 'none',
                  background: vs.btnBg,
                  color: '#fff', fontWeight: 600, fontSize: '0.85rem',
                  cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: `0 4px 14px ${vs.iconBg}`,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = `0 6px 20px ${vs.iconBg}`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 4px 14px ${vs.iconBg}`;
                }}
              >{confirmLabel}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
