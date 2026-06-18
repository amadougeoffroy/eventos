'use client';
import Sidebar from '@/components/Sidebar';
import EventLoader from '@/components/EventLoader';
import { useApp } from '@/context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { use, useState, useMemo, useCallback } from 'react';
import { Plus, X, UtensilsCrossed, BarChart3, ChevronDown, Edit3, Trash2 } from 'lucide-react';
import { ProgramItem, MenuCategory, MenuItem } from '@/lib/types';

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.45 } })
};

export default function MenuPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const { events, menuCategories, menuItems, addMenuCategory, updateMenuCategory, removeMenuCategory, addMenuItem, updateMenuItem, removeMenuItem, updateEvent, eventsLoading } = useApp();
  const event = events.find(e => e.id === eventId);

  const evtCategories = useMemo(() => menuCategories.filter(c => c.eventId === eventId).sort((a, b) => a.order - b.order), [menuCategories, eventId]);
  const evtItems = useMemo(() => menuItems.filter(i => i.eventId === eventId), [menuItems, eventId]);

  const [activeTab, setActiveTab] = useState<'menu' | 'survey'>('menu');
  const [openCat, setOpenCat] = useState<string | null>(evtCategories[0]?.id || null);
  const [showAddCat, setShowAddCat] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [addingToCat, setAddingToCat] = useState<string>('');
  const [newCat, setNewCat] = useState({ name: '', icon: '🍽️' });
  const [newItem, setNewItem] = useState({ name: '', description: '', tags: '' });
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editItem, setEditItem] = useState({ name: '', description: '', tags: '' });
  const [confirmDeleteCat, setConfirmDeleteCat] = useState<string | null>(null);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<string | null>(null);

  const handleAddCategory = () => {
    if (!newCat.name) return;
    addMenuCategory({ id: crypto.randomUUID(), eventId, name: newCat.name, icon: newCat.icon, order: evtCategories.length + 1 });
    setNewCat({ name: '', icon: '🍽️' });
    setShowAddCat(false);
  };

  const handleAddItem = () => {
    if (!newItem.name) return;
    addMenuItem({
      id: crypto.randomUUID(), eventId, categoryId: addingToCat,
      name: newItem.name, description: newItem.description,
      tags: newItem.tags ? newItem.tags.split(',').map(t => t.trim()) : [],
      status: 'active', votes: 0,
    });
    setNewItem({ name: '', description: '', tags: '' });
    setShowAddItem(false);
  };

  const handleEditItem = () => {
    if (!editingItem || !editItem.name) return;
    updateMenuItem(editingItem.id, {
      name: editItem.name,
      description: editItem.description,
      tags: editItem.tags ? editItem.tags.split(',').map(t => t.trim()) : [],
    });
    setEditingItem(null);
  };

  const handleDeleteCategory = (catId: string) => {
    removeMenuCategory(catId);
    setConfirmDeleteCat(null);
  };

  const handleDeleteItem = (itemId: string) => {
    removeMenuItem(itemId);
    setConfirmDeleteItem(null);
  };

  const totalVotes = evtItems.reduce((sum, i) => sum + (i.votes || 0), 0);

  if (!event) return eventsLoading ? <EventLoader /> : <div className="flex"><Sidebar /><main className="main-content"><p>Événement non trouvé</p></main></div>;

  return (
    <div className="flex">
      <Sidebar eventId={eventId} />
      <main className="main-content">
        {/* Header */}
        <div className="menu-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 className="font-display text-2xl font-bold" style={{ marginBottom: '0.15rem' }}>Menu</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{event.name}</p>
          </div>
          <button className="btn-primary" onClick={() => setShowAddCat(true)}><Plus size={16} /> Catégorie</button>
        </div>

        {/* Stats row */}
        <div className="menu-stats grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Catégories', value: evtCategories.length, color: '#C8A96E', bg: 'linear-gradient(135deg, rgba(200,169,110,0.12), rgba(200,169,110,0.04))' },
            { label: 'Plats', value: evtItems.length, color: '#FB923C', bg: 'linear-gradient(135deg, rgba(251,146,60,0.12), rgba(251,146,60,0.04))' },
            { label: 'Votes', value: totalVotes, color: '#5B8DB8', bg: 'linear-gradient(135deg, rgba(91,141,184,0.12), rgba(91,141,184,0.04))' },
          ].map((s, i) => (
            <motion.div
              key={s.label} initial="hidden" animate="visible" variants={fadeUp} custom={i}
              style={{ background: s.bg, border: `1px solid ${s.color}20`, borderRadius: '1rem', padding: '1.25rem', position: 'relative', overflow: 'hidden' }}
            >
              <div style={{ position: 'absolute', top: -15, right: -15, width: 50, height: 50, borderRadius: '50%', background: `${s.color}08` }} />
              <div style={{ fontSize: '1.65rem', fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: '0.15rem' }}>{s.value}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="menu-tabs" style={{
          display: 'inline-flex', gap: '0.25rem', padding: '0.25rem',
          background: 'var(--bg-card)', border: '1px solid var(--border-light)',
          borderRadius: 12, marginBottom: '1.5rem',
        }}>
          <button
            onClick={() => setActiveTab('menu')}
            style={{
              padding: '0.5rem 1.25rem', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: activeTab === 'menu' ? 'var(--gold)' : 'transparent',
              color: activeTab === 'menu' ? '#fff' : 'var(--text-muted)',
              fontWeight: 500, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem',
              transition: 'all 0.2s ease',
            }}
          >
            <UtensilsCrossed size={14} /> Menu
          </button>
          <button
            onClick={() => setActiveTab('survey')}
            style={{
              padding: '0.5rem 1.25rem', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: activeTab === 'survey' ? 'var(--gold)' : 'transparent',
              color: activeTab === 'survey' ? '#fff' : 'var(--text-muted)',
              fontWeight: 500, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem',
              transition: 'all 0.2s ease',
            }}
          >
            <BarChart3 size={14} /> Sondage
          </button>
        </div>

        {/* Survey toggle */}
        <div className="menu-survey-toggle" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.75rem 1.25rem', marginBottom: '1.25rem',
          background: 'var(--bg-card)', border: '1px solid var(--border-light)',
          borderRadius: 14,
        }}>
          <div>
            <div className="font-medium" style={{ fontSize: '0.9rem' }}>Sondage menu</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {event.meta?.menuSurveyEnabled
                ? 'Les invités peuvent voter après confirmation'
                : 'Désactivé — les invités ne verront pas le sondage'}
            </div>
          </div>
          <button
            onClick={() => {
              const currentMeta = event.meta || {};
              updateEvent(eventId, {
                meta: { ...currentMeta, menuSurveyEnabled: !currentMeta.menuSurveyEnabled },
              });
            }}
            style={{
              width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
              background: event.meta?.menuSurveyEnabled
                ? 'linear-gradient(135deg, var(--gold), var(--gold-light))'
                : 'var(--glass-border)',
              position: 'relative', transition: 'background 0.3s',
              flexShrink: 0,
            }}
          >
            <div style={{
              width: 20, height: 20, borderRadius: '50%', background: '#fff',
              position: 'absolute', top: 3,
              left: event.meta?.menuSurveyEnabled ? 25 : 3,
              transition: 'left 0.3s', boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
            }} />
          </button>
        </div>

        {activeTab === 'menu' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {evtCategories.map((cat, ci) => {
              const items = evtItems.filter(i => i.categoryId === cat.id);
              const isOpen = openCat === cat.id;
              return (
                <motion.div
                  key={cat.id} initial="hidden" animate="visible" variants={fadeUp} custom={ci + 4}
                  style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border-light)',
                    borderRadius: '1.25rem', overflow: 'hidden',
                  }}
                >
                  <div
                    onClick={() => setOpenCat(isOpen ? null : cat.id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '1.15rem 1.5rem', background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: 'rgba(200,169,110,0.08)', border: '1px solid rgba(200,169,110,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem',
                      }}>{cat.icon}</div>
                      <span className="font-semibold" style={{ fontSize: '1.05rem' }}>{cat.name}</span>
                      <span style={{
                        fontSize: '0.7rem', padding: '0.2rem 0.55rem', borderRadius: 6,
                        background: 'var(--glass)', color: 'var(--text-muted)',
                      }}>
                        {items.length} {items.length > 1 ? 'items' : 'item'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteCat(cat.id); }} className="btn-ghost p-1.5" style={{ color: '#DC3545' }}><Trash2 size={14} /></button>
                      <ChevronDown size={18} style={{ color: 'var(--text-muted)', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
                    </div>
                  </div>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                        <div style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.5rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {items.map(item => (
                              <div key={item.id} style={{
                                display: 'flex', alignItems: 'flex-start', gap: '0.85rem',
                                padding: '0.85rem', borderRadius: 12,
                                background: 'var(--glass)', border: '1px solid var(--glass-border)',
                              }}>
                                <div style={{
                                  width: 44, height: 44, borderRadius: 12,
                                  background: 'rgba(200,169,110,0.06)', border: '1px solid rgba(200,169,110,0.1)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0,
                                }}>{cat.icon}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div className="font-medium">{item.name}</div>
                                  {item.description && <div className="text-sm" style={{ color: 'var(--text-muted)', marginTop: '0.15rem' }}>{item.description}</div>}
                                  <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                    {item.tags.map(t => (
                                      <span key={t} style={{
                                        fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: 5,
                                        background: t === 'vegetarian' ? 'rgba(34,197,94,0.12)' : t === 'halal' ? 'rgba(59,130,246,0.12)' : 'var(--glass)',
                                        color: t === 'vegetarian' ? '#4ADE80' : t === 'halal' ? '#60A5FA' : 'var(--text-muted)',
                                      }}>
                                        {t === 'vegetarian' ? '🌱' : t === 'halal' ? '☪️' : t === 'seafood' ? '🐟' : t === 'gluten-free' ? '🌾' : ''} {t}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                                  {item.votes !== undefined && (
                                    <span style={{
                                      fontSize: '0.7rem', padding: '0.25rem 0.55rem', borderRadius: 6,
                                      background: 'rgba(200,169,110,0.08)', color: 'var(--gold-light)', fontWeight: 600,
                                    }}>{item.votes} votes</span>
                                  )}
                                  <button onClick={() => { setEditingItem(item); setEditItem({ name: item.name, description: item.description || '', tags: item.tags.join(', ') }); }} className="btn-ghost p-1.5"><Edit3 size={14} /></button>
                                  <button onClick={() => setConfirmDeleteItem(item.id)} className="btn-ghost p-1.5" style={{ color: '#DC3545' }}><Trash2 size={14} /></button>
                                </div>
                              </div>
                            ))}
                            <button
                              onClick={() => { setAddingToCat(cat.id); setShowAddItem(true); }}
                              style={{
                                width: '100%', padding: '0.75rem', background: 'transparent',
                                border: '2px dashed var(--border-light)', borderRadius: 12,
                                cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                              }}
                            >
                              <Plus size={16} /> Ajouter un plat
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}

            {evtCategories.length === 0 && (
              <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-light)',
                borderRadius: '1.25rem', textAlign: 'center', padding: '4rem 2rem',
              }}>
                <UtensilsCrossed size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
                <p className="font-medium" style={{ marginBottom: '0.25rem' }}>Aucune catégorie de menu</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Commencez par créer des catégories</p>
                <button className="btn-primary" onClick={() => setShowAddCat(true)}><Plus size={16} /> Créer une catégorie</button>
              </div>
            )}
          </div>
        ) : (
          /* ── Survey View ────────────────────── */
          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} custom={4}
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-light)',
              borderRadius: '1.25rem', padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 className="font-semibold" style={{ fontSize: '1.05rem' }}>Résultats du sondage</h3>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{totalVotes} votes au total</span>
            </div>
            {evtCategories.map(cat => {
              const items = evtItems.filter(i => i.categoryId === cat.id && (i.votes || 0) > 0);
              if (items.length === 0) return null;
              const catMaxVotes = Math.max(...items.map(i => i.votes || 0));
              return (
                <div key={cat.id} style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span>{cat.icon}</span>
                    <span className="font-medium">{cat.name}</span>
                  </div>
                  <div className="space-y-2">
                    {items.sort((a, b) => (b.votes || 0) - (a.votes || 0)).map(item => {
                      const pct = catMaxVotes > 0 ? ((item.votes || 0) / catMaxVotes) * 100 : 0;
                      return (
                        <div key={item.id}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                            <span>{item.name}</span>
                            <span className="font-semibold" style={{ color: 'var(--gold-light)' }}>{item.votes} votes</span>
                          </div>
                          <div className="progress-bar">
                            <motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Add Category Modal */}
        <AnimatePresence>
          {showAddCat && (
            <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddCat(false)}>
              <motion.div className="modal" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-xl font-semibold">Nouvelle catégorie</h2>
                  <button className="btn-ghost p-1.5" onClick={() => setShowAddCat(false)}><X size={18} /></button>
                </div>
                <div className="space-y-4">
                  <div><label className="label">Nom *</label><input className="input" placeholder="Ex: Entrées, Plats, Desserts..." value={newCat.name} onChange={e => setNewCat(p => ({ ...p, name: e.target.value }))} /></div>
                  <div><label className="label">Emoji</label><input className="input" placeholder="🍽️" value={newCat.icon} onChange={e => setNewCat(p => ({ ...p, icon: e.target.value }))} style={{ width: 80 }} /></div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button className="btn-secondary flex-1" onClick={() => setShowAddCat(false)}>Annuler</button>
                  <button className="btn-primary flex-1" onClick={handleAddCategory}>Créer</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Item Modal */}
        <AnimatePresence>
          {showAddItem && (
            <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddItem(false)}>
              <motion.div className="modal" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-xl font-semibold">Ajouter un plat</h2>
                  <button className="btn-ghost p-1.5" onClick={() => setShowAddItem(false)}><X size={18} /></button>
                </div>
                <div className="space-y-4">
                  <div><label className="label">Nom du plat *</label><input className="input" placeholder="Ex: Poulet yassa" value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} /></div>
                  <div><label className="label">Description</label><textarea className="input" rows={3} placeholder="Décrivez le plat..." value={newItem.description} onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))} /></div>
                  <div><label className="label">Tags (séparés par des virgules)</label><input className="input" placeholder="vegetarian, halal, seafood..." value={newItem.tags} onChange={e => setNewItem(p => ({ ...p, tags: e.target.value }))} /></div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button className="btn-secondary flex-1" onClick={() => setShowAddItem(false)}>Annuler</button>
                  <button className="btn-primary flex-1" onClick={handleAddItem}>Ajouter</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit Item Modal */}
        <AnimatePresence>
          {editingItem && (
            <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingItem(null)}>
              <motion.div className="modal" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-xl font-semibold">Modifier le plat</h2>
                  <button className="btn-ghost p-1.5" onClick={() => setEditingItem(null)}><X size={18} /></button>
                </div>
                <div className="space-y-4">
                  <div><label className="label">Nom du plat *</label><input className="input" value={editItem.name} onChange={e => setEditItem(p => ({ ...p, name: e.target.value }))} /></div>
                  <div><label className="label">Description</label><textarea className="input" rows={3} value={editItem.description} onChange={e => setEditItem(p => ({ ...p, description: e.target.value }))} /></div>
                  <div><label className="label">Tags (séparés par des virgules)</label><input className="input" value={editItem.tags} onChange={e => setEditItem(p => ({ ...p, tags: e.target.value }))} /></div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button className="btn-secondary flex-1" onClick={() => setEditingItem(null)}>Annuler</button>
                  <button className="btn-primary flex-1" onClick={handleEditItem}>Enregistrer</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Category Confirmation */}
        <AnimatePresence>
          {confirmDeleteCat && (
            <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirmDeleteCat(null)}>
              <motion.div className="modal" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(220,53,69,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                    <Trash2 size={24} style={{ color: '#DC3545' }} />
                  </div>
                  <h3 className="font-semibold" style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Supprimer cette catégorie ?</h3>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Tous les plats de cette catégorie seront aussi supprimés. Cette action est irréversible.</p>
                </div>
                <div className="flex gap-3 mt-6">
                  <button className="btn-secondary flex-1" onClick={() => setConfirmDeleteCat(null)}>Annuler</button>
                  <button className="flex-1" onClick={() => handleDeleteCategory(confirmDeleteCat)} style={{ padding: '0.65rem 1.25rem', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', background: 'linear-gradient(135deg, #DC3545, #C82333)', color: '#fff' }}>Supprimer</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Item Confirmation */}
        <AnimatePresence>
          {confirmDeleteItem && (
            <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirmDeleteItem(null)}>
              <motion.div className="modal" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(220,53,69,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                    <Trash2 size={24} style={{ color: '#DC3545' }} />
                  </div>
                  <h3 className="font-semibold" style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Supprimer ce plat ?</h3>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Cette action est irréversible.</p>
                </div>
                <div className="flex gap-3 mt-6">
                  <button className="btn-secondary flex-1" onClick={() => setConfirmDeleteItem(null)}>Annuler</button>
                  <button className="flex-1" onClick={() => handleDeleteItem(confirmDeleteItem)} style={{ padding: '0.65rem 1.25rem', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', background: 'linear-gradient(135deg, #DC3545, #C82333)', color: '#fff' }}>Supprimer</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
