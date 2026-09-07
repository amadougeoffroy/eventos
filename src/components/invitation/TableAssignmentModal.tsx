'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MapPin, X, Users, ArrowRight } from 'lucide-react';

interface TableAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  guestName: string;
  groupName?: string;
  groupEmoji?: string;
  groupColor?: string;
  tableName: string;
  companions?: number;
  planUrl: string;
}

export default function TableAssignmentModal({
  isOpen,
  onClose,
  guestName,
  groupName,
  groupEmoji = '👥',
  groupColor = '#C8A96E',
  tableName,
  companions = 0,
  planUrl,
}: TableAssignmentModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        style={{
          background: 'rgba(5, 5, 5, 0.78)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 text-center text-white"
          style={{
            background: 'linear-gradient(170deg, #1C1917 0%, #12100E 100%)',
            border: '1px solid rgba(212, 175, 55, 0.35)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 35px rgba(212, 175, 55, 0.12)',
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              color: 'rgba(255, 255, 255, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
            aria-label="Fermer"
          >
            <X size={16} />
          </button>

          {/* Top subtle badge */}
          <div
            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase mb-4"
            style={{
              background: 'rgba(212, 175, 55, 0.12)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              color: '#E5C07B',
            }}
          >
            <Sparkles size={12} />
            <span>Placement à table</span>
          </div>

          {/* Guest Greeting */}
          <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-wide text-white mb-2">
            Bonjour {guestName}
          </h2>

          {/* Category / Group badge */}
          {groupName && (
            <div className="flex justify-center mb-5">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  background: `${groupColor}15`,
                  border: `1px solid ${groupColor}35`,
                  color: groupColor,
                }}
              >
                <span>{groupEmoji}</span>
                <span>{groupName}</span>
              </span>
            </div>
          )}

          {/* Table Highlight Card */}
          <div
            className="rounded-2xl p-5 mb-5 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(212, 175, 55, 0.02) 100%)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
            }}
          >
            <p className="text-[11px] uppercase tracking-widest font-semibold mb-2" style={{ color: 'rgba(255, 255, 255, 0.55)' }}>
              Votre Table Réception
            </p>

            <div
              className="font-serif text-2xl sm:text-3xl font-bold tracking-wide"
              style={{
                color: '#FFF9ED',
                textShadow: '0 2px 12px rgba(212, 175, 55, 0.25)',
              }}
            >
              {tableName}
            </div>

            {companions > 0 && (
              <div className="inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-lg text-xs" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255, 255, 255, 0.7)' }}>
                <Users size={12} style={{ color: '#D4AF37' }} />
                <span>Avec {companions} accompagnant{companions > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>

          <p className="text-xs sm:text-sm text-white/60 leading-relaxed mb-6 px-2">
            Votre place a été réservée pour cette célébration. Consultez le plan de la salle pour repérer facilement votre table.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5">
            <a
              href={planUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-sm transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-lg cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
                color: '#100E0D',
                boxShadow: '0 4px 18px rgba(212, 175, 55, 0.35)',
              }}
            >
              <MapPin size={16} />
              <span>Voir le plan de table</span>
              <ArrowRight size={15} />
            </a>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-white/60 hover:text-white transition-colors"
            >
              Accéder à l'invitation
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
