'use client';
import Sidebar from '@/components/Sidebar';
import { useApp } from '@/context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { use, useMemo, useState } from 'react';
import { UsersRound, Plus, X, Users, Edit3, Trash2 } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.45 } })
};

const emojiOptions = ['👰', '🤵', '💃', '🕺', '💼', '🏢', '👪', '❤️', '🎓', '⭐', '🌟', '🎉'];
const colorOptions = ['#F7C5CC', '#C084FC', '#60A5FA', '#C8A96E', '#4ADE80', '#FB923C', '#DC3545', '#5B8DB8', '#A78BFA', '#22964F'];

export default function GroupsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const { events, guests, guestGroups, addGuestGroup, updateGuestGroup, removeGuestGroup } = useApp();
  const event = events.find(e => e.id === eventId);
  const eventGroups = useMemo(() => guestGroups.filter(g => g.eventId === eventId), [guestGroups, eventId]);
  const eventGuests = useMemo(() => guests.filter(g => g.eventId === eventId), [guests, eventId]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', emoji: '👪', color: '#C8A96E', description: '' });

  if (!event) return <div className="flex"><Sidebar /><main className="main-content"><p>Événement non trouvé</p></main></div>;

  const getGuestsInGroup = (groupName: string) => {
    return eventGuests.filter(g => g.group === groupName);
  };

  const openAdd = () => {
    setForm({ name: '', emoji: '👪', color: '#C8A96E', description: '' });
    setEditingId(null);
    setShowAddModal(true);
  };

  const openEdit = (groupId: string) => {
    const g = eventGroups.find(gr => gr.id === groupId);
    if (!g) return;
    setForm({ name: g.name, emoji: g.emoji, color: g.color, description: g.description || '' });
    setEditingId(groupId);
    setShowAddModal(true);
  };

  const handleSave = () => {
    if (!form.name) return;
    if (editingId) {
      updateGuestGroup(editingId, form);
    } else {
      addGuestGroup({ id: `grp-${Date.now()}`, eventId, ...form });
    }
    setShowAddModal(false);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    removeGuestGroup(id);
  };

  // Count per side
  const brideGroups = eventGroups.filter(g => g.name.toLowerCase().includes('mariée'));
  const groomGroups = eventGroups.filter(g => g.name.toLowerCase().includes('marié') && !g.name.toLowerCase().includes('mariée'));
  const otherGroups = eventGroups.filter(g => !g.name.toLowerCase().includes('marié'));

  return (
    <div className="flex">
      <Sidebar eventId={eventId} />
      <main className="main-content">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 className="font-display text-2xl font-bold" style={{ marginBottom: '0.15rem' }}>Groupes d&apos;invités</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{event.name}</p>
          </div>
          <button className="btn-primary" onClick={openAdd}><Plus size={16} /> Nouveau groupe</button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Groupes', value: eventGroups.length, color: '#C8A96E', bg: 'linear-gradient(135deg, rgba(200,169,110,0.12), rgba(200,169,110,0.04))', icon: UsersRound },
            { label: 'Invités assignés', value: eventGuests.filter(g => eventGroups.some(gr => gr.name === g.group)).length, color: '#22964F', bg: 'linear-gradient(135deg, rgba(34,150,79,0.12), rgba(34,150,79,0.04))', icon: Users },
            { label: 'Sans groupe', value: eventGuests.filter(g => !eventGroups.some(gr => gr.name === g.group)).length, color: '#DC8C28', bg: 'linear-gradient(135deg, rgba(220,140,40,0.12), rgba(220,140,40,0.04))', icon: Users },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label} initial="hidden" animate="visible" variants={fadeUp} custom={i}
                style={{ background: s.bg, border: `1px solid ${s.color}20`, borderRadius: '1rem', padding: '1.25rem', position: 'relative', overflow: 'hidden' }}
              >
                <div style={{ position: 'absolute', top: -15, right: -15, width: 50, height: 50, borderRadius: '50%', background: `${s.color}08` }} />
                <Icon size={18} color={s.color} style={{ marginBottom: '0.5rem' }} />
                <div style={{ fontSize: '1.65rem', fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: '0.15rem' }}>{s.value}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
              </motion.div>
            );
          })}
        </div>

        {/* Groups grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {eventGroups.map((group, i) => {
            const groupGuests = getGuestsInGroup(group.name);
            const confirmed = groupGuests.filter(g => g.rsvpStatus === 'confirmed').length;
            const pending = groupGuests.filter(g => g.rsvpStatus === 'pending').length;

            return (
              <motion.div
                key={group.id} initial="hidden" animate="visible" variants={fadeUp} custom={i + 3}
                style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border-light)',
                  borderRadius: '1.25rem', overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {/* Color accent bar */}
                <div style={{ height: 4, background: `linear-gradient(90deg, ${group.color}, ${group.color}66, transparent)` }} />

                <div style={{ padding: '1.25rem 1.5rem' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: 46, height: 46, borderRadius: 14,
                        background: `${group.color}15`, border: `1px solid ${group.color}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.4rem',
                      }}>
                        {group.emoji}
                      </div>
                      <div>
                        <h3 className="font-semibold" style={{ fontSize: '1rem', marginBottom: '0.15rem' }}>{group.name}</h3>
                        {group.description && (
                          <p className="text-xs" style={{ color: 'var(--text-muted)', maxWidth: 220 }}>{group.description}</p>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button
                        onClick={() => openEdit(group.id)}
                        style={{
                          width: 30, height: 30, borderRadius: 8,
                          background: 'var(--glass)', border: '1px solid var(--glass-border)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', color: 'var(--text-muted)',
                        }}
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(group.id)}
                        style={{
                          width: 30, height: 30, borderRadius: 8,
                          background: 'rgba(220,53,69,0.06)', border: '1px solid rgba(220,53,69,0.12)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', color: '#DC3545',
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Mini stats */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    {[
                      { label: 'Invités', value: groupGuests.length, color: group.color },
                      { label: 'Confirmés', value: confirmed, color: '#22964F' },
                      { label: 'En attente', value: pending, color: '#DC8C28' },
                    ].map(stat => (
                      <div
                        key={stat.label}
                        style={{
                          flex: 1, textAlign: 'center', padding: '0.5rem',
                          borderRadius: 10, background: `${stat.color}08`,
                        }}
                      >
                        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Guest avatars */}
                  {groupGuests.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {groupGuests.slice(0, 8).map(g => (
                        <div
                          key={g.id}
                          title={`${g.firstName} ${g.lastName}`}
                          style={{
                            width: 30, height: 30, borderRadius: 8,
                            background: `${group.color}15`, border: `1px solid ${group.color}25`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.6rem', fontWeight: 600, color: group.color,
                          }}
                        >
                          {g.firstName[0]}{g.lastName[0]}
                        </div>
                      ))}
                      {groupGuests.length > 8 && (
                        <div style={{
                          width: 30, height: 30, borderRadius: 8,
                          background: 'var(--glass)', border: '1px solid var(--glass-border)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-muted)',
                        }}>
                          +{groupGuests.length - 8}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem' }}>
                      Aucun invité dans ce groupe
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}

          {/* Create new group card */}
          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} custom={eventGroups.length + 3}
          >
            <div
              onClick={openAdd}
              style={{
                background: 'var(--bg-card)',
                border: '2px dashed var(--border-light)',
                borderRadius: '1.25rem',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '3rem 2rem', cursor: 'pointer', minHeight: 200,
                textAlign: 'center', transition: 'all 0.3s ease',
              }}
            >
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(200,169,110,0.12), rgba(200,169,110,0.04))',
                border: '2px dashed rgba(200,169,110,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '0.75rem',
              }}>
                <Plus size={24} style={{ color: 'var(--gold)' }} />
              </div>
              <div className="font-semibold" style={{ fontSize: '0.95rem', marginBottom: '0.25rem' }}>Créer un groupe</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)', maxWidth: 180 }}>
                Organisez vos invités par catégorie
              </div>
            </div>
          </motion.div>
        </div>

        {/* Add / Edit Group Modal */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)}>
              <motion.div className="modal" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-xl font-semibold">
                    {editingId ? 'Modifier le groupe' : 'Nouveau groupe'}
                  </h2>
                  <button className="btn-ghost p-1.5" onClick={() => setShowAddModal(false)}><X size={18} /></button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="label">Nom du groupe *</label>
                    <input className="input" placeholder="Ex: Famille de la mariée" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                  </div>

                  <div>
                    <label className="label">Emoji</label>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {emojiOptions.map(e => (
                        <button
                          key={e}
                          onClick={() => setForm(p => ({ ...p, emoji: e }))}
                          style={{
                            width: 42, height: 42, borderRadius: 10,
                            background: form.emoji === e ? 'rgba(200,169,110,0.15)' : 'var(--glass)',
                            border: `2px solid ${form.emoji === e ? 'var(--gold)' : 'var(--glass-border)'}`,
                            cursor: 'pointer', fontSize: '1.25rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s ease',
                          }}
                        >{e}</button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="label">Couleur</label>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {colorOptions.map(c => (
                        <button
                          key={c}
                          onClick={() => setForm(p => ({ ...p, color: c }))}
                          style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: c,
                            border: `3px solid ${form.color === c ? '#fff' : 'transparent'}`,
                            boxShadow: form.color === c ? `0 0 0 2px ${c}` : 'none',
                            cursor: 'pointer', transition: 'all 0.2s ease',
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="label">Description (optionnel)</label>
                    <textarea
                      className="input" rows={2}
                      placeholder="Ex: Parents, frères, sœurs et famille élargie..."
                      value={form.description}
                      onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Preview */}
                <div style={{
                  marginTop: '1rem', padding: '1rem', borderRadius: 12,
                  background: 'var(--glass)', border: '1px solid var(--glass-border)',
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 12,
                    background: `${form.color}15`, border: `1px solid ${form.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.3rem',
                  }}>{form.emoji}</div>
                  <div>
                    <div className="font-medium text-sm">{form.name || 'Nom du groupe'}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{form.description || 'Description...'}</div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button className="btn-secondary flex-1" onClick={() => setShowAddModal(false)}>Annuler</button>
                  <button className="btn-primary flex-1" onClick={handleSave}>
                    {editingId ? 'Enregistrer' : 'Créer le groupe'}
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
