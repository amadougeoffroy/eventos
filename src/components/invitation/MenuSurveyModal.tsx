'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, UtensilsCrossed, ChevronRight } from 'lucide-react';
import { Event, MenuCategory, MenuItem } from '@/lib/types';

interface MenuSurveyModalProps {
  event: Event;
  categories: MenuCategory[];
  items: MenuItem[];
  guestName: string;
  onClose: () => void;
  onSubmit: (selectedItemIds: string[]) => void;
}

export default function MenuSurveyModal({
  event, categories, items, guestName, onClose, onSubmit,
}: MenuSurveyModalProps) {
  // One selection per category
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [currentCat, setCurrentCat] = useState(0);

  const sortedCats = [...categories].sort((a, b) => a.order - b.order);
  const totalCats = sortedCats.length;

  const handleSelect = (catId: string, itemId: string) => {
    setSelections(prev => ({ ...prev, [catId]: itemId }));
  };

  const handleSubmit = () => {
    const selectedIds = Object.values(selections);
    if (selectedIds.length === 0) return;
    onSubmit(selectedIds);
    setSubmitted(true);
  };

  const selectedCount = Object.keys(selections).length;
  const cat = sortedCats[currentCat];
  const catItems = cat ? items.filter(i => i.categoryId === cat.id && i.status === 'active') : [];

  if (submitted) {
    return (
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="modal"
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          style={{ maxWidth: 420, textAlign: 'center', padding: '2.5rem 2rem' }}
        >
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12, delay: 0.2 }}
            style={{
              width: 72, height: 72, borderRadius: '50%', margin: '0 auto 1.25rem',
              background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))',
              border: '2px solid rgba(34,197,94,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Check size={32} style={{ color: '#22C55E' }} />
          </motion.div>
          <h2 className="font-display text-xl font-bold" style={{ marginBottom: '0.5rem' }}>
            Merci {guestName.split(' ')[0]} !
          </h2>
          <p className="text-sm" style={{ color: 'var(--t-text-muted, var(--text-muted))', marginBottom: '1.5rem' }}>
            Vos préférences de menu ont été enregistrées. Elles nous aideront à préparer un menu parfait !
          </p>
          <button
            onClick={onClose}
            style={{
              padding: '0.7rem 2rem', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, var(--t-accent, var(--gold)), var(--t-accent, var(--gold-light)))',
              color: '#fff', fontWeight: 600, fontSize: '0.85rem',
            }}
          >
            Fermer
          </button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ zIndex: 2000 }}
    >
      <motion.div
        className="modal"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 500, maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--t-card-border, var(--border-light))',
        }}>
          <div>
            <h2 className="font-display text-lg font-bold" style={{ marginBottom: '0.15rem' }}>
              Sondage Menu
            </h2>
            <p className="text-xs" style={{ color: 'var(--t-text-muted, var(--text-muted))' }}>
              Choisissez votre plat préféré par catégorie
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: 'var(--t-card-bg, var(--glass))', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: 'var(--t-text-muted, var(--text-muted))',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Progress */}
        <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--t-card-border, var(--border-light))' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span className="text-xs font-medium" style={{ color: 'var(--t-text-muted, var(--text-muted))' }}>
              {currentCat + 1} / {totalCats}
            </span>
            <span className="text-xs" style={{ color: 'var(--t-text-muted, var(--text-muted))' }}>
              {selectedCount} choix effectué{selectedCount > 1 ? 's' : ''}
            </span>
          </div>
          <div style={{
            height: 4, borderRadius: 2,
            background: 'var(--t-card-bg, var(--glass))',
          }}>
            <motion.div
              style={{
                height: '100%', borderRadius: 2,
                background: 'linear-gradient(90deg, var(--t-accent, var(--gold)), var(--t-accent, var(--gold-light)))',
              }}
              animate={{ width: `${((currentCat + 1) / totalCats) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Category content */}
        {cat && (
          <div style={{ flex: 1, overflow: 'auto', padding: '1.25rem 1.5rem' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem',
            }}>
              <span style={{ fontSize: '1.5rem' }}>{cat.icon}</span>
              <h3 className="font-semibold" style={{ fontSize: '1.05rem' }}>{cat.name}</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {catItems.map(item => {
                const selected = selections[cat.id] === item.id;
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => handleSelect(cat.id, item.id)}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                      padding: '0.85rem 1rem', borderRadius: 14, border: 'none', cursor: 'pointer',
                      textAlign: 'left', width: '100%',
                      background: selected
                        ? 'linear-gradient(135deg, rgba(200,169,110,0.12), rgba(200,169,110,0.04))'
                        : 'var(--t-card-bg, var(--glass))',
                      outline: selected ? '2px solid var(--t-accent, var(--gold))' : '1px solid var(--t-card-border, var(--glass-border))',
                      transition: 'all 0.2s',
                    }}
                  >
                    {/* Radio circle */}
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                      border: selected
                        ? '2px solid var(--t-accent, var(--gold))'
                        : '2px solid var(--t-card-border, var(--border-light))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: selected
                        ? 'linear-gradient(135deg, var(--t-accent, var(--gold)), var(--t-accent, var(--gold-light)))'
                        : 'transparent',
                      transition: 'all 0.2s',
                    }}>
                      {selected && <Check size={12} style={{ color: '#fff' }} />}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="font-medium" style={{ fontSize: '0.9rem', color: 'var(--t-text, var(--text))' }}>
                        {item.name}
                      </div>
                      {item.description && (
                        <div className="text-xs" style={{ color: 'var(--t-text-muted, var(--text-muted))', marginTop: '0.2rem' }}>
                          {item.description}
                        </div>
                      )}
                      {item.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                          {item.tags.map(t => (
                            <span key={t} style={{
                              fontSize: '0.6rem', padding: '0.1rem 0.4rem', borderRadius: 4,
                              background: t === 'vegetarian' ? 'rgba(34,197,94,0.12)' : t === 'halal' ? 'rgba(59,130,246,0.12)' : 'var(--glass)',
                              color: t === 'vegetarian' ? '#4ADE80' : t === 'halal' ? '#60A5FA' : 'var(--t-text-muted, var(--text-muted))',
                            }}>
                              {t === 'vegetarian' ? '🌱' : t === 'halal' ? '☪️' : t === 'seafood' ? '🐟' : ''} {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.button>
                );
              })}

              {catItems.length === 0 && (
                <div style={{
                  textAlign: 'center', padding: '2rem', color: 'var(--t-text-muted, var(--text-muted))',
                  fontSize: '0.85rem',
                }}>
                  Aucun plat dans cette catégorie
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer navigation */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 1.5rem', borderTop: '1px solid var(--t-card-border, var(--border-light))',
          gap: '0.75rem',
        }}>
          <button
            onClick={() => setCurrentCat(prev => Math.max(0, prev - 1))}
            disabled={currentCat === 0}
            style={{
              padding: '0.6rem 1.25rem', borderRadius: 10, border: '1px solid var(--t-card-border, var(--border-light))',
              background: 'transparent', cursor: currentCat === 0 ? 'not-allowed' : 'pointer',
              color: 'var(--t-text-muted, var(--text-muted))', fontSize: '0.82rem', fontWeight: 500,
              opacity: currentCat === 0 ? 0.4 : 1,
            }}
          >
            Précédent
          </button>

          {currentCat < totalCats - 1 ? (
            <button
              onClick={() => setCurrentCat(prev => Math.min(totalCats - 1, prev + 1))}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.3rem',
                padding: '0.6rem 1.25rem', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, var(--t-accent, var(--gold)), var(--t-accent, var(--gold-light)))',
                color: '#fff', fontSize: '0.82rem', fontWeight: 600,
              }}
            >
              Suivant <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={selectedCount === 0}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.3rem',
                padding: '0.6rem 1.5rem', borderRadius: 10, border: 'none',
                cursor: selectedCount === 0 ? 'not-allowed' : 'pointer',
                background: selectedCount === 0
                  ? 'var(--glass)'
                  : 'linear-gradient(135deg, #22C55E, #16A34A)',
                color: selectedCount === 0 ? 'var(--text-muted)' : '#fff',
                fontSize: '0.82rem', fontWeight: 600,
                opacity: selectedCount === 0 ? 0.5 : 1,
              }}
            >
              <Check size={14} /> Valider ({selectedCount}/{totalCats})
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
