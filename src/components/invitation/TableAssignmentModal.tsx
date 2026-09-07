'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MapPin, X, Users, Utensils, ArrowRight } from 'lucide-react';

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
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{
          background: 'rgba(10, 10, 12, 0.78)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl"
          style={{
            background: 'linear-gradient(165deg, #1C1917 0%, #12100E 100%)',
            border: '1.5px solid rgba(200, 169, 110, 0.35)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 35px rgba(200, 169, 110, 0.15)',
          }}
        >
          {/* Ambient lighting accents */}
          <div
            className="absolute -top-20 -left-20 w-48 h-48 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(200, 169, 110, 0.25) 0%, transparent 70%)',
            }}
          />
          <div
            className="absolute -bottom-20 -right-20 w-48 h-48 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, transparent 70%)',
            }}
          />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-all z-10"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              color: 'rgba(255, 255, 255, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
            aria-label="Fermer"
          >
            <X size={18} />
          </button>

          <div className="relative p-6 sm:p-8 text-center text-white">
            {/* Top Badge Icon */}
            <div className="inline-flex items-center justify-center mb-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center relative"
                style={{
                  background: 'linear-gradient(135deg, rgba(200, 169, 110, 0.25), rgba(200, 169, 110, 0.05))',
                  border: '1.5px solid rgba(200, 169, 110, 0.4)',
                  boxShadow: '0 0 20px rgba(200, 169, 110, 0.2)',
                }}
              >
                <Utensils size={28} style={{ color: '#D4AF37' }} />
                <span className="absolute -top-1 -right-1 text-xs">✨</span>
              </div>
            </div>

            {/* Greeting */}
            <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: 'rgba(200, 169, 110, 0.9)' }}>
              Votre Table d'Honneur
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold mb-2 tracking-wide text-white">
              Bonjour {guestName}
            </h2>

            {/* Category / Group badge */}
            {groupName && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-5"
                style={{
                  background: `${groupColor}18`,
                  border: `1px solid ${groupColor}40`,
                  color: groupColor,
                }}
              >
                <span>{groupEmoji}</span>
                <span>{groupName}</span>
              </div>
            )}

            {/* Table Highlight Card */}
            <div
              className="rounded-2xl p-5 mb-5 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(200, 169, 110, 0.12) 0%, rgba(200, 169, 110, 0.03) 100%)',
                border: '1.5px solid rgba(200, 169, 110, 0.4)',
                boxShadow: 'inset 0 0 20px rgba(200, 169, 110, 0.05)',
              }}
            >
              <div className="flex items-center justify-center gap-2 mb-1.5 text-xs font-semibold tracking-wider uppercase" style={{ color: '#E5C07B' }}>
                <Sparkles size={14} />
                <span>Votre table assignée</span>
                <Sparkles size={14} />
              </div>

              <div
                className="font-serif text-2xl sm:text-3xl font-extrabold tracking-wide my-1"
                style={{
                  color: '#FFF8E7',
                  textShadow: '0 2px 10px rgba(200, 169, 110, 0.3)',
                }}
              >
                {tableName}
              </div>

              {companions > 0 && (
                <div className="flex items-center justify-center gap-1.5 mt-2 text-xs" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  <Users size={13} style={{ color: '#C8A96E' }} />
                  <span>Vous & {companions} accompagnant{companions > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>

            <p className="text-xs sm:text-sm leading-relaxed mb-6" style={{ color: 'rgba(255, 255, 255, 0.65)' }}>
              Une place privilégiée vous a été préparée pour célébrer ces instants inoubliables. Découvrez l'agencement exact de la salle en consultant le plan de table.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={planUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-semibold text-sm transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #AA7C11 100%)',
                  color: '#000',
                  boxShadow: '0 4px 15px rgba(212, 175, 55, 0.35)',
                }}
              >
                <MapPin size={17} />
                <span>Voir le plan de table</span>
                <ArrowRight size={15} />
              </a>

              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: 'rgba(255, 255, 255, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                Accéder à l'invitation
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
