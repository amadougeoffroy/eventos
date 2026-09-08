'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  tableName,
  companions = 0,
  planUrl,
}: TableAssignmentModalProps) {
  if (!isOpen) return null;

  // Extract first name (e.g. "Raissa")
  const firstName = guestName?.trim() ? guestName.trim().split(' ')[0] : 'Cher invité';

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 modal-table-overlay"
        style={{
          background: 'rgba(30, 24, 18, 0.45)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Cormorant:ital@0;1&family=Jost:wght@400;500;600&display=swap');

          .modal-table-overlay {
            --ivoire: #FBF6EE;
            --ivoire-carte: #FFFDF9;
            --encre: #2B2420;
            --encre-douce: #6B6055;
            --or: #B8863C;
            --or-clair: #D9AE6C;
            --or-fond: #F3E4C6;
            --trait: #E7DCC5;
            --bleu-etiquette: #5B6E8C;
            --bleu-fond: #EAEEF4;
            font-family: 'Jost', sans-serif;
          }

          .modal-table-overlay .carte {
            position: relative;
            width: 100%;
            max-width: 460px;
            background: var(--ivoire-carte);
            border-radius: 28px;
            padding: 44px 36px 32px;
            box-shadow:
              0 1px 0 rgba(255,255,255,0.8) inset,
              0 30px 60px -20px rgba(60,45,20,0.18),
              0 10px 24px -12px rgba(60,45,20,0.10);
            border: 1px solid var(--trait);
            max-height: 92vh;
            overflow-y: auto;
          }

          .modal-table-overlay .carte::before {
            content: "";
            position: absolute;
            top: 0; left: 24px; right: 24px;
            height: 3px;
            background: linear-gradient(90deg, transparent, var(--or-clair), transparent);
            border-radius: 2px;
          }

          .modal-table-overlay .fermer {
            position: absolute;
            top: 20px; right: 20px;
            width: 32px; height: 32px;
            border-radius: 50%;
            border: 1px solid var(--trait);
            background: var(--ivoire);
            display: flex; align-items: center; justify-content: center;
            color: var(--encre-douce);
            cursor: pointer;
            font-size: 15px;
            line-height: 1;
            transition: background .15s ease, color .15s ease;
          }
          .modal-table-overlay .fermer:hover { background: var(--or-fond); color: var(--encre); }

          .modal-table-overlay .monogramme {
            width: 64px; height: 64px;
            margin: 0 auto 22px;
            border-radius: 50%;
            background: linear-gradient(160deg, #FFFCF6, var(--or-fond));
            border: 1px solid var(--or-clair);
            display: flex; align-items: center; justify-content: center;
            position: relative;
          }
          .modal-table-overlay .monogramme svg { width: 26px; height: 26px; }

          .modal-table-overlay .eyebrow {
            text-align: center;
            font-family: 'Jost', sans-serif;
            font-size: 12.5px;
            letter-spacing: .16em;
            color: var(--or);
            font-weight: 600;
            margin-bottom: 10px;
          }

          .modal-table-overlay h1 {
            text-align: center;
            font-family: 'Cormorant Garamond', serif;
            font-weight: 600;
            font-size: 40px;
            line-height: 1.15;
            color: var(--encre);
            letter-spacing: .01em;
          }

          .modal-table-overlay .sous-titre {
            text-align: center;
            font-family: 'Cormorant', serif;
            font-style: italic;
            font-size: 17px;
            color: var(--encre-douce);
            margin-top: 6px;
            margin-bottom: 18px;
          }

          .modal-table-overlay .etiquette-wrap {
            display: flex;
            justify-content: center;
            margin-bottom: 26px;
          }
          .modal-table-overlay .etiquette {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            padding: 8px 18px;
            border-radius: 999px;
            background: var(--bleu-fond);
            color: var(--bleu-etiquette);
            font-size: 14.5px;
            font-weight: 600;
            border: 1px solid #DCE3ED;
          }
          .modal-table-overlay .etiquette span.point {
            width: 6px; height: 6px; border-radius: 50%;
            background: var(--bleu-etiquette);
            display: inline-block;
          }

          .modal-table-overlay .separateur {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 22px;
          }
          .modal-table-overlay .separateur .ligne {
            flex: 1;
            height: 1px;
            background: var(--trait);
          }
          .modal-table-overlay .separateur .texte {
            font-size: 11.5px;
            letter-spacing: .14em;
            color: var(--or);
            white-space: nowrap;
            font-weight: 600;
          }

          .modal-table-overlay .bloc-table {
            text-align: center;
            background: linear-gradient(180deg, #FFFCF5, #FDF6E8);
            border: 1px solid var(--or-clair);
            border-radius: 18px;
            padding: 22px 20px 24px;
            margin-bottom: 24px;
            position: relative;
            overflow: hidden;
          }
          .modal-table-overlay .bloc-table::after {
            content: "";
            position: absolute;
            inset: 0;
            background: radial-gradient(circle at 50% 0%, rgba(217,174,108,0.12), transparent 60%);
            pointer-events: none;
          }
          .modal-table-overlay .bloc-table .numero {
            font-family: 'Cormorant Garamond', serif;
            font-size: 14px;
            letter-spacing: .1em;
            color: var(--or);
            margin-bottom: 6px;
            font-weight: 700;
          }
          .modal-table-overlay .bloc-table .nom-table {
            font-family: 'Cormorant Garamond', serif;
            font-weight: 700;
            font-size: 34px;
            color: var(--encre);
          }

          .modal-table-overlay .description {
            text-align: center;
            font-size: 15px;
            line-height: 1.65;
            color: var(--encre-douce);
            max-width: 360px;
            margin: 0 auto 28px;
          }

          .modal-table-overlay .actions {
            display: flex;
            gap: 10px;
          }
          .modal-table-overlay .btn {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 14px 12px;
            border-radius: 14px;
            font-family: 'Jost', sans-serif;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            border: 1px solid transparent;
            text-decoration: none;
            transition: transform .15s ease, box-shadow .15s ease;
          }
          .modal-table-overlay .btn:active { transform: translateY(1px); }

          .modal-table-overlay .btn-principal {
            background: linear-gradient(180deg, #C99A4E, var(--or));
            color: #FFFBF2 !important;
            box-shadow: 0 10px 20px -8px rgba(184,134,60,0.55);
          }
          .modal-table-overlay .btn-principal svg { width: 15px; height: 15px; }

          .modal-table-overlay .btn-secondaire {
            background: transparent;
            color: var(--encre);
            border: 1px solid var(--trait);
          }
          .modal-table-overlay .btn-secondaire:hover { background: var(--ivoire); }

          @media (max-width: 480px) {
            .modal-table-overlay .carte { padding: 36px 22px 24px; }
            .modal-table-overlay h1 { font-size: 34px; }
            .modal-table-overlay .bloc-table .nom-table { font-size: 30px; }
            .modal-table-overlay .actions { flex-direction: column; }
          }
        `}</style>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="carte"
        >
          <button className="fermer" onClick={onClose} aria-label="Fermer">✕</button>

          <div className="monogramme">
            <svg viewBox="0 0 24 24" fill="none" stroke="#B8863C" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2v8a2 2 0 0 0 4 0V2"/>
              <path d="M8 12v10"/>
              <path d="M18 2c-1.5 1-2 3-2 5s0.5 4 2 5c1.5-1 2-3 2-5s-0.5-4-2-5Z"/>
              <path d="M18 12v10"/>
            </svg>
          </div>

          <p className="eyebrow">Votre table d'honneur</p>
          <h1>Bonjour {firstName}</h1>
          <p className="sous-titre">Nous sommes ravis de vous compter parmi nous</p>

          {groupName && (
            <div className="etiquette-wrap">
              <span className="etiquette">
                <span className="point"></span>
                {groupName}
              </span>
            </div>
          )}

          <div className="separateur">
            <span className="ligne"></span>
            <span className="texte">VOTRE TABLE ASSIGNÉE</span>
            <span className="ligne"></span>
          </div>

          <div className="bloc-table">
            <p className="numero">TABLE</p>
            <p className="nom-table">{tableName}</p>
            {companions > 0 && (
              <p style={{ fontSize: '12px', color: 'var(--encre-douce)', marginTop: '6px' }}>
                Avec {companions} accompagnant{companions > 1 ? 's' : ''}
              </p>
            )}
          </div>

          <p className="description">
            Une place privilégiée vous a été préparée pour célébrer ces instants inoubliables. Découvrez l'agencement exact de la salle en consultant le plan de table.
          </p>

          <div className="actions">
            <a
              href={planUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="btn btn-principal"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              Voir le plan de table
            </a>
            <button className="btn btn-secondaire" onClick={onClose}>
              Mon invitation
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
