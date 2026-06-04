'use client';
import Sidebar from '@/components/Sidebar';
import EventLoader from '@/components/EventLoader';
import { useApp } from '@/context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { use, useState, useMemo } from 'react';
import { Gift, Plus, Pencil, Trash2, ExternalLink, Search, X, Package, Tag } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.45 } })
};

export default function GiftsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const { events, gifts, addGift, updateGift, removeGift, eventsLoading } = useApp();
  const event = events.find(e => e.id === eventId);
  const eventGifts = useMemo(() => gifts.filter(g => g.eventId === eventId), [gifts, eventId]);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    name: '', description: '', price: '', url: '', imageUrl: '', category: 'Général',
  });

  const categories = useMemo(() => {
    const cats = new Set(eventGifts.map(g => g.category));
    return ['Tous', ...Array.from(cats)];
  }, [eventGifts]);
  const [filterCat, setFilterCat] = useState('Tous');

  const filtered = useMemo(() => {
    let list = eventGifts;
    if (filterCat !== 'Tous') list = list.filter(g => g.category === filterCat);
    if (search) list = list.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [eventGifts, filterCat, search]);

  const stats = useMemo(() => ({
    total: eventGifts.length,
    reserved: eventGifts.filter(g => g.reserved).length,
    available: eventGifts.filter(g => !g.reserved).length,
    totalValue: eventGifts.reduce((sum, g) => sum + (g.price || 0), 0),
  }), [eventGifts]);

  if (!event) return eventsLoading ? <EventLoader /> : <div className="flex"><Sidebar /><main className="main-content"><p>Événement non trouvé</p></main></div>;

  const openAdd = () => {
    setEditingId(null);
    setForm({ name: '', description: '', price: '', url: '', imageUrl: '', category: 'Général' });
    setShowModal(true);
  };

  const openEdit = (id: string) => {
    const g = eventGifts.find(gi => gi.id === id);
    if (!g) return;
    setEditingId(id);
    setForm({
      name: g.name,
      description: g.description || '',
      price: g.price ? String(g.price) : '',
      url: g.url || '',
      imageUrl: g.imageUrl || '',
      category: g.category || 'Général',
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editingId) {
      updateGift(editingId, {
        name: form.name,
        description: form.description,
        price: form.price ? Number(form.price) : undefined,
        url: form.url,
        imageUrl: form.imageUrl,
        category: form.category,
      });
    } else {
      addGift({
        id: `gift-${Date.now()}`,
        eventId,
        name: form.name,
        description: form.description,
        price: form.price ? Number(form.price) : undefined,
        url: form.url,
        imageUrl: form.imageUrl,
        reserved: false,
        category: form.category,
      });
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Supprimer ce cadeau ?')) removeGift(id);
  };

  return (
    <div className="flex">
      <Sidebar eventId={eventId} />
      <main className="main-content">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="font-display text-2xl font-bold" style={{ marginBottom: '0.15rem' }}>Liste de cadeaux</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{event.name}</p>
          </div>
          <button onClick={openAdd} className="btn-primary" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.6rem 1.2rem', borderRadius: 10,
            background: 'linear-gradient(135deg, #C8A96E, #B8944F)',
            color: '#fff', fontWeight: 600, fontSize: '0.85rem',
            border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(200,169,110,0.3)',
          }}>
            <Plus size={16} /> Ajouter un cadeau
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Total', value: stats.total, color: '#5B8DB8', icon: Gift },
            { label: 'Réservés', value: stats.reserved, color: '#22964F', icon: Package },
            { label: 'Disponibles', value: stats.available, color: '#DC8C28', icon: Tag },
            { label: 'Valeur totale', value: `${stats.totalValue.toLocaleString('fr-FR')}€`, color: '#C8A96E', icon: Gift },
          ].map((s, i) => (
            <motion.div key={s.label} custom={i} variants={fadeUp} initial="hidden" animate="visible"
              className="card" style={{
                padding: '1rem', borderRadius: 14,
                background: `linear-gradient(135deg, ${s.color}12, ${s.color}06)`,
                border: `1px solid ${s.color}20`,
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <s.icon size={14} style={{ color: s.color }} />
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>{s.label}</span>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: s.color }}>{s.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Search + Filter */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text" placeholder="Rechercher un cadeau..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '0.55rem 0.75rem 0.55rem 2rem',
                borderRadius: 10, border: '1px solid var(--border-light)',
                background: 'var(--glass)', fontSize: '0.8rem', color: 'var(--text)',
              }}
            />
          </div>
          {categories.length > 1 && (
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {categories.map(cat => (
                <button key={cat} onClick={() => setFilterCat(cat)} style={{
                  padding: '0.4rem 0.75rem', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600,
                  border: filterCat === cat ? '1px solid var(--gold)' : '1px solid var(--border-light)',
                  background: filterCat === cat ? 'rgba(200,169,110,0.12)' : 'var(--glass)',
                  color: filterCat === cat ? 'var(--gold)' : 'var(--text-muted)',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}>{cat}</button>
              ))}
            </div>
          )}
        </div>

        {/* Gift list */}
        {filtered.length === 0 ? (
          <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '3rem 2rem', borderRadius: 16 }}>
            <Gift size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem', opacity: 0.4 }} />
            <p style={{ fontWeight: 600, marginBottom: '0.3rem' }}>Aucun cadeau</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Ajoutez des cadeaux pour que vos invités puissent vous gâter !</p>
            <button onClick={openAdd} style={{
              padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid var(--gold)',
              background: 'rgba(200,169,110,0.08)', color: 'var(--gold)',
              fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
            }}><Plus size={14} style={{ verticalAlign: -2, marginRight: 4 }} />Ajouter un cadeau</button>
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {filtered.map((gift, i) => (
              <motion.div key={gift.id} custom={i} variants={fadeUp} initial="hidden" animate="visible"
                className="card" style={{
                  padding: '1.25rem', borderRadius: 14,
                  border: gift.reserved ? '1px solid rgba(34,150,79,0.25)' : '1px solid var(--border-light)',
                  background: gift.reserved ? 'rgba(34,150,79,0.04)' : 'var(--glass)',
                  position: 'relative', transition: 'all 0.2s',
                }}>
                {/* Reserved badge */}
                {gift.reserved && (
                  <div style={{
                    position: 'absolute', top: 10, right: 10,
                    padding: '0.2rem 0.5rem', borderRadius: 6,
                    background: 'rgba(34,150,79,0.12)', fontSize: '0.6rem',
                    fontWeight: 700, color: '#22964F',
                  }}>Réservé</div>
                )}

                {/* Gift image or icon */}
                <div style={{
                  width: 48, height: 48, borderRadius: 12, marginBottom: '0.75rem',
                  background: 'linear-gradient(135deg, rgba(200,169,110,0.15), rgba(200,169,110,0.05))',
                  border: '1px solid rgba(200,169,110,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  {gift.imageUrl ? (
                    <img src={gift.imageUrl} alt={gift.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Gift size={20} style={{ color: 'var(--gold)' }} />
                  )}
                </div>

                {/* Info */}
                <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.2rem' }}>{gift.name}</h3>
                {gift.description && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', lineHeight: 1.4 }}>{gift.description}</p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  {gift.price && (
                    <span style={{
                      padding: '0.15rem 0.5rem', borderRadius: 6,
                      background: 'rgba(200,169,110,0.1)', fontSize: '0.75rem',
                      fontWeight: 700, color: 'var(--gold)',
                    }}>{gift.price.toLocaleString('fr-FR')}€</span>
                  )}
                  <span style={{
                    padding: '0.15rem 0.5rem', borderRadius: 6,
                    background: 'var(--bg-warm)', fontSize: '0.65rem',
                    fontWeight: 600, color: 'var(--text-muted)',
                  }}>{gift.category}</span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {gift.url && (
                    <a href={gift.url} target="_blank" rel="noopener noreferrer" style={{
                      width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '1px solid var(--border-light)', background: 'var(--glass)',
                      color: 'var(--text-muted)', textDecoration: 'none', cursor: 'pointer',
                    }}><ExternalLink size={13} /></a>
                  )}
                  <button onClick={() => openEdit(gift.id)} style={{
                    width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid var(--border-light)', background: 'var(--glass)',
                    color: 'var(--text-muted)', cursor: 'pointer',
                  }}><Pencil size={13} /></button>
                  <button onClick={() => handleDelete(gift.id)} style={{
                    width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid rgba(220,53,69,0.2)', background: 'rgba(220,53,69,0.04)',
                    color: '#dc3545', cursor: 'pointer',
                  }}><Trash2 size={13} /></button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                position: 'fixed', inset: 0, zIndex: 1000,
                background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
              }} onClick={() => setShowModal(false)}>
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                className="card" onClick={e => e.stopPropagation()}
                style={{
                  width: '100%', maxWidth: 440, padding: '1.5rem',
                  borderRadius: 16, background: 'var(--bg)',
                  border: '1px solid var(--border-light)',
                  maxHeight: '90vh', overflowY: 'auto',
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h2 className="font-display" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                    {editingId ? 'Modifier le cadeau' : 'Ajouter un cadeau'}
                  </h2>
                  <button onClick={() => setShowModal(false)} style={{
                    width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border-light)',
                    background: 'var(--glass)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-muted)',
                  }}><X size={14} /></button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {[
                    { label: 'Nom du cadeau *', key: 'name', placeholder: 'Ex: Robot pâtissier' },
                    { label: 'Description', key: 'description', placeholder: 'Optionnel' },
                    { label: 'Prix (€)', key: 'price', placeholder: 'Ex: 149.99', type: 'number' },
                    { label: 'Lien (URL)', key: 'url', placeholder: 'https://...' },
                    { label: 'Image (URL)', key: 'imageUrl', placeholder: 'https://...' },
                    { label: 'Catégorie', key: 'category', placeholder: 'Ex: Cuisine, Déco...' },
                  ].map(field => (
                    <div key={field.key}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-muted)' }}>
                        {field.label}
                      </label>
                      <input
                        type={field.type || 'text'}
                        value={(form as any)[field.key]}
                        onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        style={{
                          width: '100%', padding: '0.55rem 0.75rem', borderRadius: 10,
                          border: '1px solid var(--border-light)', background: 'var(--glass)',
                          fontSize: '0.85rem', color: 'var(--text)',
                        }}
                      />
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                  <button onClick={() => setShowModal(false)} style={{
                    flex: 1, padding: '0.6rem', borderRadius: 10,
                    border: '1px solid var(--border-light)', background: 'var(--glass)',
                    fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-muted)',
                  }}>Annuler</button>
                  <button onClick={handleSave} disabled={!form.name.trim()} style={{
                    flex: 1, padding: '0.6rem', borderRadius: 10,
                    background: form.name.trim() ? 'linear-gradient(135deg, #C8A96E, #B8944F)' : 'var(--glass)',
                    color: form.name.trim() ? '#fff' : 'var(--text-muted)',
                    fontWeight: 600, fontSize: '0.85rem', cursor: form.name.trim() ? 'pointer' : 'not-allowed',
                    border: form.name.trim() ? 'none' : '1px solid var(--border-light)',
                    boxShadow: form.name.trim() ? '0 2px 8px rgba(200,169,110,0.3)' : 'none',
                  }}>{editingId ? 'Enregistrer' : 'Ajouter'}</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
