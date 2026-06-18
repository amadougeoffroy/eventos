'use client';
import Sidebar from '@/components/Sidebar';
import EventLoader from '@/components/EventLoader';
import { useApp } from '@/context/AppContext';
import { useThemeLanguage } from '@/context/ThemeLanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { use, useState, useMemo } from 'react';
import { Gift, Plus, Pencil, Trash2, ExternalLink, Search, X, Package, Tag, User, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

type Offerer = { name: string; gift: string; price: number };
type SortKey = 'name' | 'gift' | 'price';
type SortDir = 'asc' | 'desc';

function OfferersTable({ offerers }: { offerers: Offerer[] }) {
  const { t, lang } = useThemeLanguage();
  const tr = t('gifts');
  const tc = t('common');
  const [q, setQ] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(0);
  const perPage = 10;

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(0);
  };

  const filtered = useMemo(() => {
    let list = offerers;
    if (q) {
      const lower = q.toLowerCase();
      list = list.filter(o => o.name.toLowerCase().includes(lower) || o.gift.toLowerCase().includes(lower));
    }
    list = [...list].sort((a, b) => {
      const aVal = a[sortKey]; const bVal = b[sortKey];
      if (typeof aVal === 'number' && typeof bVal === 'number') return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      return sortDir === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
    });
    return list;
  }, [offerers, q, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice(page * perPage, (page + 1) * perPage);

  const thStyle = (key: SortKey, align: 'left' | 'right' = 'left'): React.CSSProperties => ({
    textAlign: align, padding: '0.65rem 1rem', fontWeight: 700,
    color: sortKey === key ? 'var(--gold)' : 'var(--text-muted)',
    fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em',
    cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
  });

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ChevronUp size={10} style={{ opacity: 0.3 }} />;
    return sortDir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      style={{ marginTop: '2rem' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 className="font-display" style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <User size={16} style={{ color: 'var(--gold)' }} />
          {tr.whoOffersWhat}
          <span style={{
            padding: '0.15rem 0.5rem', borderRadius: 8,
            background: 'rgba(34,150,79,0.1)', fontSize: '0.65rem',
            fontWeight: 700, color: '#22964F',
          }}>{filtered.length} {filtered.length > 1 ? tr.offererPlural : tr.offerers}</span>
        </h2>
        <div style={{ position: 'relative', minWidth: 180 }}>
          <Search size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text" placeholder={tr.searchOfferers}
            value={q} onChange={e => { setQ(e.target.value); setPage(0); }}
            style={{
              width: '100%', padding: '0.45rem 0.6rem 0.45rem 1.8rem',
              borderRadius: 8, border: '1px solid var(--border-light)',
              background: 'var(--glass)', fontSize: '0.75rem', color: 'var(--text)',
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="gifts-offerers-wrap card" style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border-light)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: 'rgba(200,169,110,0.06)' }}>
                <th style={thStyle('name')} onClick={() => toggleSort('name')}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>{tr.offerer} <SortIcon k="name" /></span>
                </th>
                <th style={thStyle('gift')} onClick={() => toggleSort('gift')}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>{tr.gift} <SortIcon k="gift" /></span>
                </th>
                <th style={thStyle('price', 'right')} onClick={() => toggleSort('price')}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end' }}>{tr.totalValue} <SortIcon k="price" /></span>
                </th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={3} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{tc.noResults}</td></tr>
              ) : paged.map((o, i) => (
                <tr key={`${o.name}-${o.gift}-${i}`} style={{ borderTop: '1px solid var(--border-light)', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(200,169,110,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '0.6rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(200,169,110,0.2), rgba(200,169,110,0.08))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.65rem', fontWeight: 700, color: 'var(--gold)', flexShrink: 0,
                      }}>{o.name.charAt(0).toUpperCase()}</div>
                      <span style={{ fontWeight: 600 }}>{o.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '0.6rem 1rem', color: 'var(--text-muted)' }}>🎁 {o.gift}</td>
                  <td style={{ padding: '0.6rem 1rem', textAlign: 'right', fontWeight: 700, color: 'var(--gold)' }}>
                    {o.price ? `${o.price.toLocaleString(lang === 'en' ? 'en-US' : 'fr-FR')}€` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '0.5rem 1rem', borderTop: '1px solid var(--border-light)',
            fontSize: '0.7rem', color: 'var(--text-muted)',
          }}>
            <span>{page * perPage + 1}–{Math.min((page + 1) * perPage, filtered.length)} {tc.of} {filtered.length}</span>
            <div style={{ display: 'flex', gap: '0.3rem' }}>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                style={{
                  width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border-light)',
                  background: 'var(--glass)', cursor: page === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: page === 0 ? 'var(--text-muted)' : 'var(--text)', opacity: page === 0 ? 0.4 : 1,
                }}><ChevronLeft size={14} /></button>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                style={{
                  width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border-light)',
                  background: 'var(--glass)', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: page >= totalPages - 1 ? 'var(--text-muted)' : 'var(--text)', opacity: page >= totalPages - 1 ? 0.4 : 1,
                }}><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.45 } })
};

export default function GiftsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const { events, gifts, addGift, updateGift, removeGift, eventsLoading } = useApp();
  const { t, lang } = useThemeLanguage();
  const tr = t('gifts');
  const tc = t('common');
  const event = events.find(e => e.id === eventId);
  const eventGifts = useMemo(() => gifts.filter(g => g.eventId === eventId), [gifts, eventId]);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<{ name: string; description: string; price: string; url: string; imageUrl: string; category: string }>({
    name: '', description: '', price: '', url: '', imageUrl: '', category: tr.defaultCategory,
  });

  const categories = useMemo(() => {
    const cats = new Set(eventGifts.map(g => g.category));
    return [tr.all, ...Array.from(cats)];
  }, [eventGifts]);
  const [filterCat, setFilterCat] = useState<string>(tr.all);

  const filtered = useMemo(() => {
    let list = eventGifts;
    if (filterCat !== tr.all) list = list.filter(g => g.category === filterCat);
    if (search) list = list.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [eventGifts, filterCat, search]);

  const stats = useMemo(() => ({
    total: eventGifts.length,
    reserved: eventGifts.filter(g => g.reserved).length,
    available: eventGifts.filter(g => !g.reserved).length,
    totalValue: eventGifts.filter(g => g.reserved).reduce((sum, g) => {
      const offerers = g.reservedByName ? g.reservedByName.split(', ').filter(Boolean).length : 1;
      return sum + (g.price || 0) * offerers;
    }, 0),
  }), [eventGifts]);

  if (!event) return eventsLoading ? <EventLoader /> : <div className="flex"><Sidebar /><main className="main-content"><p>{tc.eventNotFound}</p></main></div>;

  const openAdd = () => {
    setEditingId(null);
    setForm({ name: '', description: '', price: '', url: '', imageUrl: '', category: tr.defaultCategory });
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
      category: g.category || tr.defaultCategory,
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
    if (confirm(tr.deleteConfirm)) removeGift(id);
  };

  return (
    <div className="flex">
      <Sidebar eventId={eventId} />
      <main className="main-content">
        {/* Header */}
        <div className="gifts-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="font-display text-2xl font-bold" style={{ marginBottom: '0.15rem' }}>{tr.title}</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{event.name}</p>
          </div>
          <button onClick={openAdd} className="btn-primary" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.6rem 1.2rem', borderRadius: 10,
            background: 'linear-gradient(135deg, #C8A96E, #B8944F)',
            color: '#fff', fontWeight: 600, fontSize: '0.85rem',
            border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(200,169,110,0.3)',
          }}>
            <Plus size={16} /> {tr.addGift}
          </button>
        </div>

        {/* Stats */}
        <div className="gifts-stats grid grid-cols-4 gap-4 mb-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {[
            { label: tr.total, value: stats.total, color: '#5B8DB8', icon: Gift },
            { label: tr.willBeOffered, value: stats.reserved, color: '#22964F', icon: Package },
            { label: tr.totalValue, value: `${stats.totalValue.toLocaleString(lang === 'en' ? 'en-US' : 'fr-FR')}€`, color: '#C8A96E', icon: Gift },
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
        <div className="gifts-filters" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text" placeholder={tr.search}
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
            <p style={{ fontWeight: 600, marginBottom: '0.3rem' }}>{tr.noGifts}</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{tr.noGiftsDesc}</p>
            <button onClick={openAdd} style={{
              padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid var(--gold)',
              background: 'rgba(200,169,110,0.08)', color: 'var(--gold)',
              fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
            }}><Plus size={14} style={{ verticalAlign: -2, marginRight: 4 }} />{tr.addGift}</button>
          </motion.div>
        ) : (
          <div className="gifts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {filtered.map((gift, i) => (
              <motion.div key={gift.id} custom={i} variants={fadeUp} initial="hidden" animate="visible"
                className="card" style={{
                  padding: '1.25rem', borderRadius: 14,
                  border: gift.reserved ? '1px solid rgba(34,150,79,0.25)' : '1px solid var(--border-light)',
                  background: gift.reserved ? 'rgba(34,150,79,0.04)' : 'var(--glass)',
                  position: 'relative', transition: 'all 0.2s',
                }}>
                {/* Reserved badge */}
                {gift.reserved && (() => {
                  const names = gift.reservedByName ? gift.reservedByName.split(', ').filter(Boolean) : [];
                  return (
                    <div style={{
                      position: 'absolute', top: 10, right: 10,
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem',
                    }}>
                      <div style={{
                        padding: '0.2rem 0.5rem', borderRadius: 6,
                        background: 'rgba(34,150,79,0.12)', fontSize: '0.6rem',
                        fontWeight: 700, color: '#22964F',
                      }}>{tr.reserved}{names.length > 1 ? ` (${names.length})` : ''}</div>
                      {names.map((name, ni) => (
                        <div key={ni} style={{
                          padding: '0.15rem 0.45rem', borderRadius: 6,
                          background: 'rgba(200,169,110,0.1)', fontSize: '0.6rem',
                          fontWeight: 600, color: 'var(--gold)',
                          display: 'flex', alignItems: 'center', gap: '0.2rem',
                        }}>
                          <User size={9} /> {name}
                        </div>
                      ))}
                    </div>
                  );
                })()}

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

        {/* Offerers DataTable */}
        {(() => {
          const offerers: { name: string; gift: string; price: number }[] = [];
          eventGifts.forEach(g => {
            if (g.reserved) {
              if (g.reservedByName) {
                g.reservedByName.split(', ').filter(Boolean).forEach(name => {
                  offerers.push({ name, gift: g.name, price: g.price || 0 });
                });
              } else {
                offerers.push({ name: tr.unknownGuest, gift: g.name, price: g.price || 0 });
              }
            }
          });
          if (offerers.length === 0) return null;
          return <OfferersTable offerers={offerers} />;
        })()}

        {/* Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}>
              <motion.div className="modal" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: 440 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h2 className="font-display" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                    {editingId ? tr.editGift : tr.addGiftTitle}
                  </h2>
                  <button onClick={() => setShowModal(false)} style={{
                    width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border-light)',
                    background: 'var(--glass)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-muted)',
                  }}><X size={14} /></button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {[
                    { label: tr.giftNameRequired, key: 'name', placeholder: tr.giftNamePlaceholder },
                    { label: tr.description, key: 'description', placeholder: tr.descPlaceholder },
                    { label: tr.price, key: 'price', placeholder: tr.pricePlaceholder, type: 'number' },
                    { label: tr.url, key: 'url', placeholder: 'https://...' },
                    { label: tr.imageUrl, key: 'imageUrl', placeholder: 'https://...' },
                    { label: tr.category, key: 'category', placeholder: tr.categoryPlaceholder },
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
                  }}>{tc.cancel}</button>
                  <button onClick={handleSave} disabled={!form.name.trim()} style={{
                    flex: 1, padding: '0.6rem', borderRadius: 10,
                    background: form.name.trim() ? 'linear-gradient(135deg, #C8A96E, #B8944F)' : 'var(--glass)',
                    color: form.name.trim() ? '#fff' : 'var(--text-muted)',
                    fontWeight: 600, fontSize: '0.85rem', cursor: form.name.trim() ? 'pointer' : 'not-allowed',
                    border: form.name.trim() ? 'none' : '1px solid var(--border-light)',
                    boxShadow: form.name.trim() ? '0 2px 8px rgba(200,169,110,0.3)' : 'none',
                  }}>{editingId ? tr.save : tr.add}</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
