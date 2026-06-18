'use client';
import Sidebar from '@/components/Sidebar';
import EventLoader from '@/components/EventLoader';
import { useApp } from '@/context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { use, useState, useMemo } from 'react';
import { RSVPStatus } from '@/lib/types';
import {
  Users, Plus, Search, Filter, Send, Download, UserCheck, Clock,
  UserX, HelpCircle, Trash2, X, Copy, Check, TrendingUp, Edit3, UserPlus, AlertTriangle,
  ArrowUpDown, ChevronLeft, ChevronRight
} from 'lucide-react';

const statusConfig: Record<string, { label: string; badge: string; icon: React.ElementType; color: string }> = {
  confirmed: { label: 'Confirmé', badge: 'badge-confirmed', icon: UserCheck, color: '#22964F' },
  pending:   { label: 'En attente', badge: 'badge-pending', icon: Clock, color: '#DC8C28' },
  declined:  { label: 'Décliné', badge: 'badge-declined', icon: UserX, color: '#DC3545' },
  maybe:     { label: 'Peut-être', badge: 'badge-maybe', icon: HelpCircle, color: '#A78BFA' },
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.45 } })
};

type SortKey = 'name' | 'group' | 'status' | 'contact';


type DisplayRow = {
  id: string;
  guestId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  group: string;
  rsvpStatus: RSVPStatus;
  side?: 'bride' | 'groom' | 'both';
  companions: number;
  dietaryRestrictions: string[];
  token: string;
  isCompanion: boolean;
  source?: 'manual' | 'rsvp';
  companionIndex?: number;
  parentName?: string;
};

export default function GuestsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const { guests, events, guestGroups, addGuest, updateGuest, removeGuest, eventsLoading } = useApp();
  const event = events.find(e => e.id === eventId);
  const eventGuests = useMemo(() => guests.filter(g => g.eventId === eventId), [guests, eventId]);
  const eventGuestGroups = useMemo(() => guestGroups.filter(g => g.eventId === eventId), [guestGroups, eventId]);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [newGuest, setNewGuest] = useState({ firstName: '', lastName: '', email: '', phone: '', group: '' });
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', phone: '', group: '', rsvpStatus: 'pending' as RSVPStatus });

  const groups = useMemo(() => [...new Set(eventGuests.map(g => g.group))], [eventGuests]);

  // Build display rows: main guests + companion rows
  const displayRows = useMemo<DisplayRow[]>(() => {
    const rows: DisplayRow[] = [];
    eventGuests.forEach(g => {
      // Main guest row
      rows.push({
        id: g.id,
        guestId: g.id,
        firstName: g.firstName,
        lastName: g.lastName,
        email: g.email || '',
        phone: g.phone || '',
        group: g.group,
        rsvpStatus: g.rsvpStatus,
        side: g.side,
        companions: g.companions,
        dietaryRestrictions: g.dietaryRestrictions || [],
        token: g.token,
        source: g.source,
        isCompanion: false,
      });
      // Companion rows
      for (let i = 0; i < g.companions; i++) {
        rows.push({
          id: `${g.id}-comp-${i}`,
          guestId: g.id,
          firstName: `Accompagnant ${i + 1}`,
          lastName: `de ${g.firstName}`,
          email: '',
          phone: '',
          group: g.group,
          rsvpStatus: g.rsvpStatus, // same status as parent
          side: g.side,
          companions: 0,
          dietaryRestrictions: [],
          token: g.token,
          isCompanion: true,
          companionIndex: i + 1,
          parentName: `${g.firstName} ${g.lastName}`,
        });
      }
    });
    return rows;
  }, [eventGuests]);

  const filtered = useMemo(() => {
    return displayRows.filter(g => {
      const matchSearch = `${g.firstName} ${g.lastName}`.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'all' || g.rsvpStatus === filterStatus;
      const matchGroup = filterGroup === 'all' || g.group === filterGroup;
      return matchSearch && matchStatus && matchGroup;
    });
  }, [displayRows, search, filterStatus, filterGroup]);

  // Sort
  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name': cmp = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`); break;
        case 'group': cmp = a.group.localeCompare(b.group); break;
        case 'status': cmp = a.rsvpStatus.localeCompare(b.rsvpStatus); break;
        case 'contact': cmp = (a.email || '').localeCompare(b.email || ''); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const safePage = Math.min(page, totalPages);
  const paginated = sorted.slice((safePage - 1) * perPage, safePage * perPage);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  };

  const SortHeader = ({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) => (
    <th
      onClick={() => toggleSort(sortKeyName)}
      style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
        {label}
        <ArrowUpDown size={12} style={{
          opacity: sortKey === sortKeyName ? 1 : 0.3,
          color: sortKey === sortKeyName ? 'var(--gold)' : 'var(--text-muted)',
          transform: sortKey === sortKeyName && sortDir === 'desc' ? 'scaleY(-1)' : 'none',
        }} />
      </span>
    </th>
  );

  const totalPersons = eventGuests.reduce((sum, g) => sum + 1 + g.companions, 0);
  const stats = {
    total: totalPersons,
    invites: eventGuests.length,
    companions: eventGuests.reduce((sum, g) => sum + g.companions, 0),
    confirmed: eventGuests.filter(g => g.rsvpStatus === 'confirmed').length,
    pending: eventGuests.filter(g => g.rsvpStatus === 'pending').length,
    declined: eventGuests.filter(g => g.rsvpStatus === 'declined').length,
    maybe: eventGuests.filter(g => g.rsvpStatus === 'maybe').length,
  };
  const confirmRate = stats.invites > 0 ? Math.round((stats.confirmed / stats.invites) * 100) : 0;

  const handleAddGuest = () => {
    if (!newGuest.firstName || !newGuest.lastName) return;
    addGuest({
      id: `g-${Date.now()}`, eventId, ...newGuest,
      rsvpStatus: 'pending', token: `tok-${Date.now()}`,
      companions: 0, dietaryRestrictions: [], source: 'manual',
    });
    setNewGuest({ firstName: '', lastName: '', email: '', phone: '', group: '' });
    setShowAddModal(false);
  };

  const openEditModal = (guestId: string) => {
    const g = eventGuests.find(gu => gu.id === guestId);
    if (!g) return;
    setEditForm({
      firstName: g.firstName,
      lastName: g.lastName,
      email: g.email || '',
      phone: g.phone || '',
      group: g.group,
      rsvpStatus: g.rsvpStatus,
    });
    setEditingGuest(guestId);
    setShowEditModal(true);
  };

  const handleEditGuest = () => {
    if (!editingGuest || !editForm.firstName) return;
    updateGuest(editingGuest, {
      firstName: editForm.firstName,
      lastName: editForm.lastName || '',
      email: editForm.email || undefined,
      phone: editForm.phone || undefined,
      group: editForm.group,
      rsvpStatus: editForm.rsvpStatus,
    });
    setShowEditModal(false);
    setEditingGuest(null);
  };

  const copyLink = (row: DisplayRow) => {
    const guest = eventGuests.find(g => g.id === row.guestId);
    if (!guest) return;
    const link = `${window.location.origin}/e/${event?.slug}?guest=${encodeURIComponent(`${guest.firstName}-${guest.lastName}`)}&token=${guest.token}`;
    navigator.clipboard.writeText(link);
    setCopiedId(row.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!event) return eventsLoading ? <EventLoader /> : <div className="flex"><Sidebar /><main className="main-content"><p>Événement non trouvé</p></main></div>;

  const statCards = [
    { label: 'Total personnes', value: stats.total, sub: `${stats.invites} invités + ${stats.companions} accomp.`, color: '#5B8DB8', bg: 'linear-gradient(135deg, rgba(91,141,184,0.12), rgba(91,141,184,0.04))' },
    { label: 'Confirmés', value: stats.confirmed, sub: `${confirmRate}%`, color: '#22964F', bg: 'linear-gradient(135deg, rgba(34,150,79,0.12), rgba(34,150,79,0.04))' },
    { label: 'En attente', value: stats.pending, sub: '', color: '#DC8C28', bg: 'linear-gradient(135deg, rgba(220,140,40,0.12), rgba(220,140,40,0.04))' },
    { label: 'Déclinés', value: stats.declined, sub: '', color: '#DC3545', bg: 'linear-gradient(135deg, rgba(220,53,69,0.12), rgba(220,53,69,0.04))' },
    { label: 'Peut-être', value: stats.maybe, sub: '', color: '#A78BFA', bg: 'linear-gradient(135deg, rgba(167,139,250,0.12), rgba(167,139,250,0.04))' },
  ];

  return (
    <div className="flex">
      <Sidebar eventId={eventId} />
      <main className="main-content">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 className="font-display text-2xl font-bold" style={{ marginBottom: '0.15rem' }}>Invités</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{event.name}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn-secondary"><Download size={16} /> Exporter</button>
            <button className="btn-primary" onClick={() => setShowAddModal(true)}><Plus size={16} /> Ajouter</button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {statCards.map((s, i) => (
            <motion.div
              key={s.label} initial="hidden" animate="visible" variants={fadeUp} custom={i}
              style={{ background: s.bg, border: `1px solid ${s.color}20`, borderRadius: '1rem', padding: '1.25rem', position: 'relative', overflow: 'hidden' }}
            >
              <div style={{ position: 'absolute', top: -15, right: -15, width: 50, height: 50, borderRadius: '50%', background: `${s.color}08` }} />
              <div style={{ fontSize: '1.65rem', fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: '0.15rem' }}>{s.value}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
              {s.sub && <div className="text-xs" style={{ color: s.color, marginTop: '0.2rem', opacity: 0.7 }}>{s.sub}</div>}
            </motion.div>
          ))}
        </div>

        {/* Confirmation gauge */}
        <motion.div
          initial="hidden" animate="visible" variants={fadeUp} custom={5}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '1rem', padding: '1rem 1.5rem', marginBottom: '1.25rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span className="text-sm" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><TrendingUp size={14} /> Taux de confirmation</span>
            <span className="text-sm font-bold" style={{ color: '#22964F' }}>{confirmRate}%</span>
          </div>
          <div className="progress-bar" style={{ height: 8 }}>
            <motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: `${confirmRate}%` }} transition={{ duration: 1, delay: 0.4 }} />
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial="hidden" animate="visible" variants={fadeUp} custom={6}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '1rem', padding: '1rem 1.25rem', marginBottom: '1.25rem' }}
        >
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input className="input pl-10" placeholder="Rechercher un invité..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={14} style={{ color: 'var(--text-muted)' }} />
              <select className="input" style={{ width: 'auto' }} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
                <option value="all">Tous les statuts</option>
                <option value="confirmed">Confirmés</option>
                <option value="pending">En attente</option>
                <option value="declined">Déclinés</option>
                <option value="maybe">Peut-être</option>
              </select>
              <select className="input" style={{ width: 'auto' }} value={filterGroup} onChange={e => { setFilterGroup(e.target.value); setPage(1); }}>
                <option value="all">Tous les groupes</option>
                {groups.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
        </motion.div>

        {/* DataTable */}
        <motion.div
          initial="hidden" animate="visible" variants={fadeUp} custom={7}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '1.25rem', overflow: 'hidden' }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <SortHeader label="Nom" sortKeyName="name" />
                  <SortHeader label="Groupe" sortKeyName="group" />
                  <SortHeader label="Statut RSVP" sortKeyName="status" />
                  <SortHeader label="Contact" sortKeyName="contact" />
                  <th>Régime</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {paginated.map((row, i) => {
                    const scfg = statusConfig[row.rsvpStatus];
                    const StatusIcon = scfg.icon;
                    return (
                      <motion.tr
                        key={row.id}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.015 }}
                        style={{ opacity: row.isCompanion ? 0.75 : 1 }}
                      >
                        <td>
                          <div className="flex items-center gap-2.5">
                            <div style={{
                              width: 34, height: 34, borderRadius: 10,
                              background: row.isCompanion ? 'rgba(167,139,250,0.1)' : 'rgba(200,169,110,0.12)',
                              border: `1px solid ${row.isCompanion ? 'rgba(167,139,250,0.2)' : 'rgba(200,169,110,0.2)'}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.7rem', fontWeight: 600,
                              color: row.isCompanion ? '#A78BFA' : 'var(--gold-light)',
                            }}>
                              {row.isCompanion ? <UserPlus size={14} /> : <>{row.firstName[0]}{row.lastName[0]}</>}
                            </div>
                            <div>
                              <div className="font-medium" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                {row.firstName} {row.lastName}
                                {row.isCompanion && (
                                  <span style={{
                                    fontSize: '0.6rem', fontWeight: 600, padding: '0.1rem 0.4rem',
                                    borderRadius: 4, background: 'rgba(167,139,250,0.1)', color: '#A78BFA',
                                  }}>
                                    Accompagnant
                                  </span>
                                )}
                              </div>
                              {!row.isCompanion && (
                                <span style={{
                                  fontSize: '0.6rem', padding: '0.1rem 0.4rem', borderRadius: 4, fontWeight: 500,
                                  background: row.source === 'rsvp' ? 'rgba(59,130,246,0.1)' : 'rgba(200,169,110,0.1)',
                                  color: row.source === 'rsvp' ? '#60A5FA' : '#C8A96E',
                                }}>
                                  {row.source === 'rsvp' ? '📨 Via lien' : '✏️ Ajouté manuellement'}
                                </span>
                              )}
                              {row.side && !row.isCompanion && (
                                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                  {row.side === 'bride' ? 'Côté mariée' : row.side === 'groom' ? 'Côté marié' : ''}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td><span className="text-sm">{row.group}</span></td>
                        <td><span className={`badge ${scfg.badge}`}><StatusIcon size={12} />{scfg.label}</span></td>
                        <td>
                          {row.isCompanion ? (
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>via {row.parentName}</span>
                          ) : (
                            <div className="text-xs">
                              {row.email && <div>{row.email}</div>}
                              {row.phone && <div style={{ color: 'var(--text-muted)' }}>{row.phone}</div>}
                              {!row.email && !row.phone && <span style={{ color: 'var(--text-muted)' }}>—</span>}
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="flex gap-1 flex-wrap">
                            {row.dietaryRestrictions?.map(r => (
                              <span key={r} className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--glass)', color: 'var(--text-muted)' }}>{r}</span>
                            ))}
                            {(!row.dietaryRestrictions || row.dietaryRestrictions.length === 0) && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>}
                          </div>
                        </td>
                        <td>
                          {!row.isCompanion ? (
                            <div className="flex items-center gap-1">
                              <button className="btn-ghost p-1.5" onClick={() => openEditModal(row.guestId)} title="Modifier">
                                <Edit3 size={14} />
                              </button>
                              <button className="btn-ghost p-1.5" onClick={() => copyLink(row)} title="Copier le lien">
                                {copiedId === row.id ? <Check size={14} style={{ color: '#22964F' }} /> : <Copy size={14} />}
                              </button>
                              <button className="btn-ghost p-1.5" title="Envoyer invitation"><Send size={14} /></button>
                              <button className="btn-ghost p-1.5" onClick={() => setDeleteTarget({ id: row.guestId, name: `${row.firstName} ${row.lastName}`.trim() })} title="Supprimer"><Trash2 size={14} style={{ color: '#F87171' }} /></button>
                            </div>
                          ) : (
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Empty state */}
          {sorted.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <Users size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
              <p style={{ color: 'var(--text-muted)' }}>Aucun invité trouvé</p>
            </div>
          )}

          {/* Pagination Footer */}
          {sorted.length > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.85rem 1.25rem',
              borderTop: '1px solid var(--border-light)',
              flexWrap: 'wrap', gap: '0.75rem',
            }}>
              {/* Left: result count */}
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {sorted.length} résultat{sorted.length > 1 ? 's' : ''}
                {sorted.length !== displayRows.length && ` sur ${displayRows.length}`}
              </span>

              {/* Center: per-page selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Afficher</span>
                <select
                  className="input"
                  value={perPage}
                  onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }}
                  style={{ width: 'auto', padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                >
                  {[10, 15, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>par page</span>
              </div>

              {/* Right: page nav */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  style={{
                    width: 30, height: 30, borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--glass)', border: '1px solid var(--glass-border)',
                    cursor: safePage <= 1 ? 'not-allowed' : 'pointer',
                    opacity: safePage <= 1 ? 0.4 : 1,
                    color: 'var(--text-muted)',
                  }}
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    const showEllipsis = prev && p - prev > 1;
                    return (
                      <span key={p} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.15rem' }}>
                        {showEllipsis && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', padding: '0 0.15rem' }}>…</span>}
                        <button
                          onClick={() => setPage(p)}
                          style={{
                            width: 30, height: 30, borderRadius: 8,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: safePage === p ? 'var(--gold)' : 'var(--glass)',
                            border: `1px solid ${safePage === p ? 'var(--gold)' : 'var(--glass-border)'}`,
                            color: safePage === p ? '#fff' : 'var(--text-muted)',
                            fontWeight: safePage === p ? 600 : 400,
                            fontSize: '0.75rem', cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                        >{p}</button>
                      </span>
                    );
                  })}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  style={{
                    width: 30, height: 30, borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--glass)', border: '1px solid var(--glass-border)',
                    cursor: safePage >= totalPages ? 'not-allowed' : 'pointer',
                    opacity: safePage >= totalPages ? 0.4 : 1,
                    color: 'var(--text-muted)',
                  }}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* ── Add Guest Modal ──────────────────── */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)}>
              <motion.div className="modal" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-xl font-semibold">Ajouter un invité</h2>
                  <button className="btn-ghost p-1.5" onClick={() => setShowAddModal(false)}><X size={18} /></button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="label">Prénom *</label><input className="input" placeholder="Jean-Baptiste" value={newGuest.firstName} onChange={e => setNewGuest(p => ({ ...p, firstName: e.target.value }))} /></div>
                    <div><label className="label">Nom *</label><input className="input" placeholder="Koné" value={newGuest.lastName} onChange={e => setNewGuest(p => ({ ...p, lastName: e.target.value }))} /></div>
                  </div>
                  <div><label className="label">Email</label><input className="input" type="email" placeholder="email@exemple.com" value={newGuest.email} onChange={e => setNewGuest(p => ({ ...p, email: e.target.value }))} /></div>
                  <div><label className="label">Téléphone</label><input className="input" placeholder="+225 07 12 34 56" value={newGuest.phone} onChange={e => setNewGuest(p => ({ ...p, phone: e.target.value }))} /></div>
                  <div>
                    <label className="label">Groupe</label>
                    <select className="input" value={newGuest.group} onChange={e => setNewGuest(p => ({ ...p, group: e.target.value }))}>
                      <option value="">Sélectionner un groupe...</option>
                      {eventGuestGroups.map(g => <option key={g.id} value={g.name}>{g.emoji} {g.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button className="btn-secondary flex-1" onClick={() => setShowAddModal(false)}>Annuler</button>
                  <button className="btn-primary flex-1" onClick={handleAddGuest}>Ajouter</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Edit Guest Modal ─────────────────── */}
        <AnimatePresence>
          {showEditModal && editingGuest && (
            <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEditModal(false)}>
              <motion.div className="modal" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-xl font-semibold">Modifier l&apos;invité</h2>
                  <button className="btn-ghost p-1.5" onClick={() => setShowEditModal(false)}><X size={18} /></button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="label">Prénom *</label><input className="input" value={editForm.firstName} onChange={e => setEditForm(p => ({ ...p, firstName: e.target.value }))} /></div>
                    <div><label className="label">Nom *</label><input className="input" value={editForm.lastName} onChange={e => setEditForm(p => ({ ...p, lastName: e.target.value }))} /></div>
                  </div>
                  <div><label className="label">Email</label><input className="input" type="email" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} /></div>
                  <div><label className="label">Téléphone</label><input className="input" value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} /></div>
                  <div>
                    <label className="label">Groupe</label>
                    <select className="input" value={editForm.group} onChange={e => setEditForm(p => ({ ...p, group: e.target.value }))}>
                      <option value="">Sélectionner un groupe...</option>
                      {eventGuestGroups.map(g => <option key={g.id} value={g.name}>{g.emoji} {g.name}</option>)}
                      {/* Allow custom value if not in groups */}
                      {editForm.group && !eventGuestGroups.some(g => g.name === editForm.group) && (
                        <option value={editForm.group}>{editForm.group}</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="label">Statut RSVP</label>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {Object.entries(statusConfig).map(([key, cfg]) => {
                        const Icon = cfg.icon;
                        const isSelected = editForm.rsvpStatus === key;
                        return (
                          <button
                            key={key}
                            onClick={() => setEditForm(p => ({ ...p, rsvpStatus: key as RSVPStatus }))}
                            style={{
                              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                              padding: '0.55rem 0.5rem', borderRadius: 10,
                              background: isSelected ? `${cfg.color}15` : 'var(--glass)',
                              border: `2px solid ${isSelected ? cfg.color : 'var(--glass-border)'}`,
                              cursor: 'pointer', fontSize: '0.75rem', fontWeight: isSelected ? 600 : 400,
                              color: isSelected ? cfg.color : 'var(--text-muted)',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <Icon size={14} /> {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button className="btn-secondary flex-1" onClick={() => setShowEditModal(false)}>Annuler</button>
                  <button className="btn-primary flex-1" onClick={handleEditGuest}>Enregistrer</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {deleteTarget && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                position: 'fixed', inset: 0, zIndex: 1100,
                background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
              }}
              onClick={() => setDeleteTarget(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                onClick={e => e.stopPropagation()}
                style={{
                  background: 'var(--bg-card)', borderRadius: 20, padding: '2rem',
                  maxWidth: 400, width: '100%', textAlign: 'center',
                  border: '1px solid rgba(220,53,69,0.15)',
                  boxShadow: '0 25px 60px rgba(0,0,0,0.3), 0 0 40px rgba(220,53,69,0.08)',
                }}
              >
                {/* Animated warning icon */}
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }}
                  style={{
                    width: 64, height: 64, borderRadius: '50%', margin: '0 auto 1.25rem',
                    background: 'linear-gradient(135deg, rgba(220,53,69,0.12), rgba(220,53,69,0.04))',
                    border: '2px solid rgba(220,53,69,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <AlertTriangle size={28} style={{ color: '#DC3545' }} />
                </motion.div>

                <h3 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                  Supprimer cet invité ?
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.25rem', lineHeight: 1.5 }}>
                  Vous êtes sur le point de supprimer
                </p>
                <p style={{
                  fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)',
                  marginBottom: '1.5rem', padding: '0.5rem 1rem', borderRadius: 10,
                  background: 'rgba(220,53,69,0.06)', border: '1px solid rgba(220,53,69,0.1)',
                  display: 'inline-block',
                }}>
                  {deleteTarget.name || 'Invité'}
                </p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  Cette action est irréversible.
                </p>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => setDeleteTarget(null)}
                    style={{
                      flex: 1, padding: '0.7rem', borderRadius: 12,
                      background: 'var(--glass)', border: '1px solid var(--border-light)',
                      color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.82rem',
                      cursor: 'pointer', transition: 'background 0.2s',
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => { removeGuest(deleteTarget.id); setDeleteTarget(null); }}
                    style={{
                      flex: 1, padding: '0.7rem', borderRadius: 12,
                      background: 'linear-gradient(135deg, #DC3545, #C82333)',
                      border: 'none', color: '#fff', fontWeight: 600, fontSize: '0.82rem',
                      cursor: 'pointer', transition: 'opacity 0.2s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                    }}
                  >
                    <Trash2 size={14} />
                    Supprimer
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
