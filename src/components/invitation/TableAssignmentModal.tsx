'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, Users, Utensils } from 'lucide-react';

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

  // Extract first name for the warm greeting (fallback to full guestName)
  const firstName = guestName?.trim() ? guestName.trim().split(' ')[0] : 'Invité';

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        style={{
          background: 'rgba(20, 18, 15, 0.45)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-[390px] sm:max-w-[430px] max-h-[92vh] overflow-y-auto rounded-3xl p-6 sm:p-8 text-center"
          style={{
            background: '#FAF7F2',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.25), 0 0 35px rgba(212, 175, 55, 0.1)',
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-white/80 hover:bg-white text-stone-500 hover:text-stone-800 border border-stone-200"
            aria-label="Fermer"
          >
            <X size={15} />
          </button>

          {/* Top Utensils Icon in Gold Circle */}
          <div className="flex justify-center mb-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #FAF4E8 0%, #F0E3CC 100%)',
                border: '1px solid #DFC9A7',
                boxShadow: '0 2px 8px rgba(180, 150, 100, 0.12)',
              }}
            >
              <Utensils size={22} strokeWidth={1.5} className="text-[#A67C38]" />
            </div>
          </div>

          {/* Tagline */}
          <p
            className="text-[10px] sm:text-[11px] uppercase tracking-widest font-semibold mb-1"
            style={{ color: '#A67C38' }}
          >
            Votre table d'honneur
          </p>

          {/* Greeting */}
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-[#1F1D1A] mb-1">
            Bonjour {firstName}
          </h2>

          {/* Subtitle */}
          <p className="italic text-xs sm:text-sm text-[#736B5E] mb-3.5">
            Nous sommes ravis de vous compter parmi nous
          </p>

          {/* Category / Group Badge */}
          {groupName && (
            <div className="flex justify-center mb-5">
              <span
                className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium"
                style={{
                  background: '#EDF2F8',
                  border: '1px solid #D3DFEE',
                  color: '#4B6B94',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#4B6B94]" />
                <span>{groupName}</span>
              </span>
            </div>
          )}

          {/* Divider with Center Label */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E8DEC8]" />
            </div>
            <div className="relative flex justify-center">
              <span
                className="px-3 text-[10px] sm:text-[11px] font-semibold tracking-widest uppercase"
                style={{
                  background: '#FAF7F2',
                  color: '#9C7A4A',
                }}
              >
                Votre table assignée
              </span>
            </div>
          </div>

          {/* Table Highlight Card */}
          <div
            className="rounded-2xl p-5 mb-5 text-center"
            style={{
              background: 'linear-gradient(180deg, #FDFBF7 0%, #F5EFE3 100%)',
              border: '1px solid #DFCDB5',
              boxShadow: '0 2px 10px rgba(180, 150, 100, 0.08)',
            }}
          >
            <p
              className="text-[10px] sm:text-[11px] uppercase tracking-widest font-semibold mb-1"
              style={{ color: '#A07E48' }}
            >
              Table
            </p>

            <div className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
              {tableName}
            </div>

            {companions > 0 && (
              <div className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-0.5 rounded-full text-xs text-[#736B5E] bg-white/70 border border-[#E8DEC8]">
                <Users size={12} style={{ color: '#A07E48' }} />
                <span>Avec {companions} accompagnant{companions > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>

          {/* Descriptive text */}
          <p className="text-xs sm:text-[13px] leading-relaxed text-[#5C5549] text-center mb-6 max-w-xs mx-auto">
            Une place privilégiée vous a été préparée pour célébrer ces instants inoubliables. Découvrez l'agencement exact de la salle en consultant le plan de table.
          </p>

          {/* Two Action Buttons Side-by-Side */}
          <div className="grid grid-cols-2 gap-3">
            <a
              href={planUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-semibold text-xs sm:text-sm text-white transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-md cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #B88846 0%, #A2722F 100%)',
                boxShadow: '0 4px 14px rgba(162, 114, 47, 0.35)',
              }}
            >
              <MapPin size={15} />
              <span>Voir le plan de table</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center py-3 px-3 rounded-xl font-semibold text-xs sm:text-sm text-[#2D2823] transition-colors border border-[#E0D9CD] bg-white hover:bg-[#FAF8F5] cursor-pointer"
            >
              Mon invitation
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
