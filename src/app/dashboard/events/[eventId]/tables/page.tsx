'use client';
import Sidebar from '@/components/Sidebar';
import EventLoader from '@/components/EventLoader';
import { useApp } from '@/context/AppContext';
import { useThemeLanguage } from '@/context/ThemeLanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { use, useState, useMemo, useRef, useEffect, useCallback, createRef } from 'react';
import {
  Users, Plus, Table, LayoutGrid, Settings, X, Check, Copy, Edit3, Trash2, ArrowUpDown, ChevronLeft, ChevronRight, UserPlus, Save, RefreshCcw, Search, CheckCircle, Clock, UserX, Sparkles, Zap
} from 'lucide-react';
import Draggable from 'react-draggable'; // ensure this dependency exists

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.45 } })
};

type TableForm = { name: string; capacity: number; shape: 'round' | 'rectangle' | 'square'; };

type Assignment = { guestId: string; tableId: string; };

export default function TablesPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const { events, guests, tables, tablesReady, guestGroups, addTable, updateTable, removeTable, updateGuest, eventsLoading } = useApp();
  const { t } = useThemeLanguage();
  const tr = t('tables');
  const event = events.find(e => e.id === eventId);

  // ---------- State ----------
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSmartModal, setShowSmartModal] = useState(false);
  const [newTable, setNewTable] = useState<TableForm>({ name: '', capacity: 8, shape: 'round' });
  const [smartCapacity, setSmartCapacity] = useState(8);
  const [dragPositions, setDragPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [assignments, setAssignments] = useState<Record<string, string>>({}); // guestId -> tableId
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [currentTable, setCurrentTable] = useState<any>(null);
  const [searchGuest, setSearchGuest] = useState('');
  const [hydrated, setHydrated] = useState(false);

  // ---------- Helpers ----------
  const eventGuests = useMemo(() => guests.filter(g => g.eventId === eventId), [guests, eventId]);
  const confirmedGuests = useMemo(() => eventGuests.filter(g => g.rsvpStatus === 'confirmed'), [eventGuests]);
  const allRows = useMemo(() => {
    const rows = [] as any[];
    confirmedGuests.forEach(g => {
      rows.push({ ...g, isCompanion: false });
      for (let i = 0; i < g.companions; i++) {
        rows.push({
          id: `${g.id}-comp-${i}`,
          firstName: `${tr.companionAbbr} ${i + 1}`,
          lastName: g.lastName,
          email: '',
          phone: '',
          group: g.group,
          rsvpStatus: g.rsvpStatus,
          side: g.side,
          isCompanion: true,
          parentId: g.id,
        });
      }
    });
    return rows;
  }, [confirmedGuests]);

  // Hydrate positions from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`table-positions-${eventId}`);
      if (saved) setDragPositions(JSON.parse(saved));
    } catch { /* ignore */ }
    setHydrated(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  // Sync positions from Supabase tables if not in localStorage or across devices
  useEffect(() => {
    if (!tablesReady) return;
    setDragPositions(prev => {
      let changed = false;
      const next = { ...prev };
      tables.filter(t => t.eventId === eventId).forEach(t => {
        if (!next[t.id] && (t.positionX !== undefined || t.positionY !== undefined)) {
          next[t.id] = { x: t.positionX || 0, y: t.positionY || 0 };
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [tables, eventId, tablesReady]);

  // Keep assignments in sync with tables.guestIds (fires on every tables change)
  useEffect(() => {
    const existing: Record<string, string> = {};
    tables.filter(t => t.eventId === eventId).forEach(t => {
      t.guestIds.forEach(gid => { existing[gid] = t.id; });
    });
    setAssignments(existing);
  }, [tables, eventId]);

  const assignedIds = useMemo(() => new Set(Object.keys(assignments)), [assignments]);
  const filteredGuests = useMemo(() =>
    allRows.filter(g =>
      !assignedIds.has(g.id) &&
      `${g.firstName} ${g.lastName}`.toLowerCase().includes(searchGuest.toLowerCase())
    ), [searchGuest, allRows, assignedIds]);

  // Stats
  const totalConfirmed = allRows.length;
  const totalAssigned = assignedIds.size;
  const totalUnassigned = totalConfirmed - totalAssigned;

  // ---------- Table des Mariés ----------
  const MARIES_TABLE_ID = `maries-${eventId}`;
  const brideName = event?.meta?.brideName || tr.bride;
  const groomName = event?.meta?.groomName || tr.groom;

  useEffect(() => {
    if (!tablesReady || !event) return;

    // 1. Table des Mariés for weddings
    const mariesExists = tables.find(t => t.id === MARIES_TABLE_ID);
    if (!mariesExists && event.type === 'wedding') {
      addTable({
        id: MARIES_TABLE_ID,
        eventId,
        name: tr.coupleTable,
        capacity: 2,
        shape: 'square',
        positionX: 350,
        positionY: 20,
        guestIds: [],
      });
    }

    // 2. Auto-create group tables if no user tables exist yet (excluding mariés)
    const eventGuestGroups = guestGroups.filter(g => g.eventId === eventId);
    const userTables = tables.filter(t => t.eventId === eventId && !isMarieTable(t.id));
    if (userTables.length === 0 && eventGuestGroups.length > 0) {
      const positions: Record<string, { x: number; y: number }> = {};
      eventGuestGroups.forEach((grp, i) => {
        const tableId = `t-grp-${grp.id}`;
        // Count guests in this group
        const groupGuestCount = eventGuests.filter(g => g.group === grp.name).length;
        const capacity = Math.max(8, groupGuestCount);
        const col = i % 4;
        const row = Math.floor(i / 4);
        const x = 30 + col * 160;
        const y = 80 + row * 140;
        addTable({
          id: tableId,
          eventId,
          name: grp.name,
          capacity,
          shape: 'round',
          positionX: x,
          positionY: y,
          guestIds: [],
        });
        positions[tableId] = { x, y };
      });
      try { localStorage.setItem(`table-positions-${eventId}`, JSON.stringify(positions)); } catch {}
      setDragPositions(prev => ({ ...prev, ...positions }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, tablesReady]);

  const isMarieTable = (id: string) => id === MARIES_TABLE_ID;

  // ---------- Table Creation ----------
  const handleAddTable = () => {
    if (!newTable.name) return;
    const id = `t-${Date.now()}`;
    addTable({
      id,
      eventId,
      name: newTable.name,
      capacity: newTable.capacity,
      shape: newTable.shape,
      positionX: 100,
      positionY: 100,
      guestIds: []
    });
    setNewTable({ name: '', capacity: 8, shape: 'round' });
    setShowAddModal(false);
  };

  // ---------- Smart Organization ----------
  const smartOrganize = () => {
    const cap = smartCapacity;
    if (cap < 1) return;

    // Group guests by their group name
    const grouped = {} as Record<string, any[]>;
    allRows.forEach(g => {
      const grp = g.group || tr.noGroup;
      if (!grouped[grp]) grouped[grp] = [];
      grouped[grp].push(g);
    });

    // Remove all existing tables for this event EXCEPT mariés table
    tables.filter(t => t.eventId === eventId && !isMarieTable(t.id)).forEach(t => removeTable(t.id));

    const newAssign = {} as Record<string, string>;
    const allNewTableIds = [] as string[];
    let gridCol = 0;

    // For each group, create as many tables as needed
    Object.entries(grouped).forEach(([groupName, members]) => {
      const numTables = Math.ceil(members.length / cap);
      for (let ti = 0; ti < numTables; ti++) {
        const tableId = `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const slice = members.slice(ti * cap, (ti + 1) * cap);
        const tableName = numTables > 1 ? `${groupName} ${ti + 1}` : groupName;

        // Spread tables in a grid pattern
        const col = gridCol % 4;
        const row = Math.floor(gridCol / 4);
        gridCol++;

        addTable({
          id: tableId,
          eventId,
          name: tableName,
          capacity: cap,
          shape: 'round',
          positionX: 30 + col * 160,
          positionY: 30 + row * 140,
          guestIds: slice.map(g => g.id),
        });

        slice.forEach(g => { newAssign[g.id] = tableId; });
        allNewTableIds.push(tableId);
      }
    });

    // Save positions to localStorage
    const positions = {} as Record<string, { x: number; y: number }>;
    allNewTableIds.forEach((tid, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      positions[tid] = { x: 30 + col * 160, y: 30 + row * 140 };
    });
    try { localStorage.setItem(`table-positions-${eventId}`, JSON.stringify(positions)); } catch {}
    setDragPositions(positions);
    setAssignments(newAssign);
    setShowSmartModal(false);
  };

  // ---------- Drag handling ----------
  const nodeRefs = useRef<Record<string, React.RefObject<HTMLDivElement | null>>>({});
  // Ensure every table has a ref
  tables.forEach(t => {
    if (!nodeRefs.current[t.id]) {
      nodeRefs.current[t.id] = createRef<HTMLDivElement>();
    }
  });

  const getTablePos = (t: any) => {
    if (dragPositions[t.id]) return dragPositions[t.id];
    return { x: t.positionX || 0, y: t.positionY || 0 };
  };

  const handleDrag = (e: any, data: any, tableId: string) => {
    const newPos = { x: data.x, y: data.y };
    setDragPositions(prev => {
      const updated = { ...prev, [tableId]: newPos };
      // Persist to localStorage
      try { localStorage.setItem(`table-positions-${eventId}`, JSON.stringify(updated)); } catch { /* ignore */ }
      return updated;
    });
    updateTable(tableId, { positionX: data.x, positionY: data.y });
  };

  // ---------- Assignment UI ----------
  const handleAssign = (guestId: string, tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    if (table.guestIds.length >= table.capacity) return; // capacity guard
    const newIds = [...table.guestIds, guestId];
    updateTable(tableId, { guestIds: newIds });
    setAssignments(prev => ({ ...prev, [guestId]: tableId }));
  };

  const handleUnassign = (guestId: string) => {
    // Find the table either from assignments map or by scanning guestIds
    let tableId = assignments[guestId];
    if (!tableId) {
      const found = tables.find(t => t.guestIds.includes(guestId));
      if (found) tableId = found.id;
    }
    if (!tableId) return;
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    const newIds = table.guestIds.filter(id => id !== guestId);
    updateTable(tableId, { guestIds: newIds });
    setAssignments(prev => {
      const copy = { ...prev };
      delete copy[guestId];
      return copy;
    });
  };

  if (!event) return eventsLoading ? <EventLoader /> : <div className="flex"><Sidebar /><main className="main-content"><p>{tr.eventNotFound}</p></main></div>;

  return (
    <div className="flex">
      <Sidebar eventId={eventId} />
      <main className="main-content">
        {/* Header */}
        <div className="tables-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 className="font-display text-2xl font-bold" style={{ marginBottom: '0.15rem' }}>{tr.title}</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{event.name}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => setShowAddModal(true)}><Plus size={16} /> {tr.addTable}</button>
            <button className="btn-secondary" onClick={() => setShowSmartModal(true)}><RefreshCcw size={16} /> {tr.smartOrg}</button>
          </div>
        </div>

        {/* ── Stats ──────────────────────────── */}
        <motion.div
          initial="hidden" animate="visible" variants={fadeUp} custom={2}
          className="tables-stats"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))', gap: '1rem', marginBottom: '1.5rem' }}
        >
          {[
            { label: tr.confirmedGuests, value: totalConfirmed, icon: Users, color: 'var(--gold)', bg: 'rgba(200,169,110,0.08)', border: 'rgba(200,169,110,0.15)' },
            { label: tr.assignedGuests, value: totalAssigned, icon: CheckCircle, color: '#22964F', bg: 'rgba(34,150,79,0.08)', border: 'rgba(34,150,79,0.15)' },
            { label: tr.unassigned, value: totalUnassigned, icon: Clock, color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.15)' },
            { label: tr.tables, value: tables.length, icon: LayoutGrid, color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.15)' },
          ].map((s, i) => (
            <div key={i} style={{
              background: 'var(--bg-card)', border: `1px solid ${s.border}`,
              borderRadius: '1rem', padding: '1.15rem 1.25rem',
              display: 'flex', alignItems: 'center', gap: '0.85rem', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, left: '1rem', right: '1rem', height: 2, background: `linear-gradient(90deg, transparent, ${s.color}, transparent)`, opacity: 0.35 }} />
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: s.bg, border: `1.5px solid ${s.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color,
              }}>
                <s.icon size={20} />
              </div>
              <div>
                <p suppressHydrationWarning style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{s.value}</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>{s.label}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Floor plan with draggable tables */}
        <motion.div
          initial="hidden" animate="visible" variants={fadeUp} custom={5}
          className="tables-floor"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '1rem', padding: '1.5rem', minHeight: '400px', position: 'relative', overflow: 'auto' }}
        >
          {!hydrated && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{tr.loadingPlan}</p>
            </div>
          )}
          {hydrated && tables.length === 0 && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.5rem' }}>
              <LayoutGrid size={32} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{tr.createTablesHint}</p>
            </div>
          )}
          {hydrated && tables.map(t => {
            const pos = getTablePos(t);
            const ref = nodeRefs.current[t.id];
            const isFull = t.guestIds.length >= t.capacity;
            return (
              <Draggable
                key={t.id}
                nodeRef={ref}
                bounds="parent"
                position={pos}
                onStop={(e, data) => handleDrag(e, data, t.id)}
              >
                <div
                  ref={ref}
                  style={{
                    width: isMarieTable(t.id) ? 120 : 90,
                    height: isMarieTable(t.id) ? 120 : 90,
                    borderRadius: isMarieTable(t.id) ? 16 : t.shape === 'round' ? '50%' : t.shape === 'square' ? 12 : '30%',
                    background: isMarieTable(t.id)
                      ? 'linear-gradient(135deg, rgba(200,169,110,0.15), rgba(200,169,110,0.05))'
                      : isFull ? 'rgba(34,150,79,0.08)' : 'rgba(200,169,110,0.06)',
                    border: isMarieTable(t.id)
                      ? '2.5px solid var(--gold)'
                      : `2px solid ${isFull ? 'rgba(34,150,79,0.4)' : 'var(--gold)'}`,
                    boxShadow: isMarieTable(t.id) ? '0 0 20px rgba(200,169,110,0.2), inset 0 0 15px rgba(200,169,110,0.05)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                    cursor: 'grab', position: 'absolute', top: 0, left: 0,
                    backdropFilter: 'blur(8px)',
                    transition: 'border-color 0.3s, background 0.3s',
                  }}
                  title={`${t.name} – ${t.guestIds.length}/${t.capacity}`}
                >
                  {isMarieTable(t.id) ? (
                    <>
                      <span style={{ fontSize: '1.1rem', marginBottom: 2 }}>👑</span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--gold)', lineHeight: 1.2 }}>{brideName}</span>
                      <span style={{ fontSize: '0.55rem', color: 'var(--gold)', opacity: 0.7 }}>&</span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--gold)', lineHeight: 1.2 }}>{groomName}</span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>{t.name}</span>
                      <span style={{
                        fontSize: '0.62rem', fontWeight: 600, marginTop: 2,
                        color: isFull ? '#22964F' : 'var(--gold)',
                      }}>{t.guestIds.length}/{t.capacity}</span>
                    </>
                  )}
                </div>
              </Draggable>
            );
          })}
        </motion.div>

        {/* ── Table Cards ──────────────────────── */}
        <motion.div
          initial="hidden" animate="visible" variants={fadeUp} custom={6}
          className="tables-cards"
          style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))', gap: '1.25rem' }}
        >
          {tables.map(t => {
            const pct = t.capacity > 0 ? Math.round((t.guestIds.length / t.capacity) * 100) : 0;
            const isFull = t.guestIds.length >= t.capacity;
            const isMarie = isMarieTable(t.id);

            // ─── Special Mariés Card ───
            if (isMarie) {
              return (
                <motion.div
                  key={t.id}
                  whileHover={{ y: -3 }}
                  style={{
                    background: 'linear-gradient(135deg, rgba(200,169,110,0.08), rgba(200,169,110,0.02))',
                    border: '1.5px solid var(--gold)',
                    borderRadius: '1.25rem', padding: '1.25rem', position: 'relative', overflow: 'hidden',
                    transition: 'border-color 0.3s ease',
                  }}
                >
                  {/* Gold top accent – thicker */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }} />

                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: 'linear-gradient(135deg, var(--gold), var(--gold-light))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.2rem',
                    }}>
                      👑
                    </div>
                    <div>
                      <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--gold)', margin: 0 }}>{tr.coupleTable}</h3>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{tr.coupleTableDesc}</span>
                    </div>
                  </div>

                  {/* Couple names */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                    padding: '1rem', borderRadius: 12,
                    background: 'rgba(200,169,110,0.06)', border: '1px solid rgba(200,169,110,0.12)',
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', margin: '0 auto 0.35rem',
                        background: 'linear-gradient(135deg, rgba(200,169,110,0.2), rgba(200,169,110,0.08))',
                        border: '1.5px solid rgba(200,169,110,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.7rem', fontWeight: 700, color: 'var(--gold)',
                      }}>
                        {brideName[0]}
                      </div>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>{brideName}</span>
                    </div>
                    <span style={{ fontSize: '1.1rem', color: 'var(--gold)' }}>💍</span>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', margin: '0 auto 0.35rem',
                        background: 'linear-gradient(135deg, rgba(200,169,110,0.2), rgba(200,169,110,0.08))',
                        border: '1.5px solid rgba(200,169,110,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.7rem', fontWeight: 700, color: 'var(--gold)',
                      }}>
                        {groomName[0]}
                      </div>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>{groomName}</span>
                    </div>
                  </div>
                </motion.div>
              );
            }

            // ─── Normal Table Card ───
            return (
              <motion.div
                key={t.id}
                whileHover={{ y: -3 }}
                style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border-light)',
                  borderRadius: '1.25rem', padding: '1.25rem', position: 'relative', overflow: 'hidden',
                  transition: 'border-color 0.3s ease',
                }}
              >
                {/* Gold top accent */}
                <div style={{ position: 'absolute', top: 0, left: '1.25rem', right: '1.25rem', height: 2, background: 'linear-gradient(90deg, transparent, var(--gold), transparent)', opacity: 0.5 }} />

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: t.shape === 'round' ? '50%' : 10,
                      background: isFull ? 'rgba(34,150,79,0.1)' : 'rgba(200,169,110,0.1)',
                      border: `1.5px solid ${isFull ? 'rgba(34,150,79,0.25)' : 'rgba(200,169,110,0.25)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.85rem',
                    }}>
                      {t.shape === 'round' ? '⭕' : t.shape === 'rectangle' ? '▬' : '⬜'}
                    </div>
                    <div>
                      <h3 style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', margin: 0 }}>{t.name}</h3>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {t.shape === 'round' ? tr.round : t.shape === 'rectangle' ? tr.rectangle : tr.square}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 600, padding: '0.2rem 0.55rem', borderRadius: 20,
                      background: isFull ? 'rgba(34,150,79,0.1)' : 'rgba(200,169,110,0.08)',
                      color: isFull ? '#22964F' : 'var(--gold)',
                      border: `1px solid ${isFull ? 'rgba(34,150,79,0.2)' : 'rgba(200,169,110,0.15)'}`,
                    }}>
                      {t.guestIds.length}/{t.capacity}
                    </span>
                    <button
                      onClick={() => { if (t.guestIds.length === 0) removeTable(t.id); }}
                      disabled={t.guestIds.length > 0}
                      title={t.guestIds.length > 0 ? tr.removeBeforeDelete : tr.deleteTable}
                      style={{
                        background: 'none', border: 'none', padding: 4, borderRadius: 6,
                        cursor: t.guestIds.length > 0 ? 'not-allowed' : 'pointer',
                        opacity: t.guestIds.length > 0 ? 0.25 : 0.6,
                        color: '#F87171', transition: 'opacity 0.2s',
                      }}
                      onMouseEnter={e => { if (t.guestIds.length === 0) e.currentTarget.style.opacity = '1'; }}
                      onMouseLeave={e => { if (t.guestIds.length === 0) e.currentTarget.style.opacity = '0.6'; }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ height: 4, borderRadius: 2, background: 'var(--glass)', marginBottom: '0.85rem', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 2, width: `${pct}%`,
                    background: isFull ? 'linear-gradient(90deg, #22964F, #34D399)' : 'linear-gradient(90deg, var(--gold), var(--gold-light))',
                    transition: 'width 0.4s ease',
                  }} />
                </div>

                {/* Guest list */}
                <div style={{ maxHeight: 140, overflowY: 'auto', marginBottom: '0.75rem' }}>
                  {t.guestIds.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                      <Users size={20} style={{ color: 'var(--text-muted)', margin: '0 auto 0.35rem', opacity: 0.4 }} />
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>{tr.noGuestsAssigned}</p>
                    </div>
                  ) : (
                    t.guestIds.map(gid => {
                      const g = allRows.find(r => r.id === gid);
                      if (!g) return null;
                      return (
                        <div key={gid} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '0.35rem 0.5rem', borderRadius: 8, marginBottom: 2,
                          transition: 'background 0.15s',
                        }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--glass)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <div style={{
                              width: 24, height: 24, borderRadius: 6,
                              background: g.isCompanion ? 'rgba(167,139,250,0.1)' : 'rgba(200,169,110,0.1)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.55rem', fontWeight: 600,
                              color: g.isCompanion ? '#A78BFA' : 'var(--gold)',
                            }}>
                              {g.isCompanion ? <UserPlus size={10} /> : <>{g.firstName?.[0]}{g.lastName?.[0]}</>}
                            </div>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                              {g.firstName} {g.lastName}
                            </span>
                            {g.isCompanion && (
                              <span style={{ fontSize: '0.55rem', fontWeight: 600, padding: '0.05rem 0.3rem', borderRadius: 4, background: 'rgba(167,139,250,0.1)', color: '#A78BFA' }}>{tr.companionAbbr}</span>
                            )}
                          </div>
                          <button
                            onClick={() => handleUnassign(gid)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, borderRadius: 4, color: 'var(--text-muted)', transition: 'color 0.2s' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#F87171')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                            title={tr.removeGuest}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Affecter button */}
                <button
                  onClick={() => { setCurrentTable(t); setShowAssignModal(true); setSearchGuest(''); }}
                  disabled={isFull}
                  style={{
                    width: '100%', padding: '0.55rem', borderRadius: 10, border: 'none', cursor: isFull ? 'not-allowed' : 'pointer',
                    background: isFull ? 'var(--glass)' : 'linear-gradient(135deg, var(--gold), var(--gold-light))',
                    color: isFull ? 'var(--text-muted)' : '#fff',
                    fontWeight: 600, fontSize: '0.78rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                    opacity: isFull ? 0.5 : 1, transition: 'opacity 0.2s',
                  }}
                >
                  <Plus size={14} /> {isFull ? tr.tableFull : tr.assignGuest}
                </button>
              </motion.div>
            );
          })}

          {tables.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '1.25rem' }}>
              <LayoutGrid size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 0.75rem', opacity: 0.4 }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>{tr.noTables}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '0.25rem' }}>{tr.noTablesDesc}</p>
            </div>
          )}
        </motion.div>

        {/* ── Assign Guest Modal ──────────────────── */}
        <AnimatePresence>
          {showAssignModal && currentTable && (
            <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAssignModal(false)}>
              <motion.div
                className="modal"
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: 460 }}
              >
                {/* Modal header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div>
                    <h2 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>{tr.assignTo.replace('{name}', currentTable.name)}</h2>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>
                      {tr.seatsOccupied.replace('{n}', String(currentTable.guestIds.length)).replace('{total}', String(currentTable.capacity))}
                    </p>
                  </div>
                  <button onClick={() => setShowAssignModal(false)} style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <X size={16} />
                  </button>
                </div>

                {/* Search */}
                <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                  <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    className="input"
                    placeholder={tr.searchByName}
                    value={searchGuest}
                    onChange={e => setSearchGuest(e.target.value)}
                    style={{ paddingLeft: '2.25rem' }}
                    autoFocus
                  />
                </div>

                {/* Guest list */}
                <div style={{ maxHeight: 320, overflowY: 'auto', borderRadius: 10, border: '1px solid var(--border-light)', background: 'var(--glass)' }}>
                  {filteredGuests.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                      <Users size={28} style={{ color: 'var(--text-muted)', margin: '0 auto 0.5rem', opacity: 0.4 }} />
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                        {searchGuest ? tr.noGuestFound : tr.allAssigned}
                      </p>
                    </div>
                  ) : (
                    filteredGuests.map((g, i) => (
                      <div
                        key={g.id}
                        onClick={() => { handleAssign(g.id, currentTable.id); setSearchGuest(''); }}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '0.6rem 0.85rem', cursor: 'pointer',
                          borderBottom: i < filteredGuests.length - 1 ? '1px solid var(--border-light)' : 'none',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(200,169,110,0.06)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                          <div style={{
                            width: 30, height: 30, borderRadius: 8,
                            background: g.isCompanion ? 'rgba(167,139,250,0.1)' : 'rgba(200,169,110,0.1)',
                            border: `1px solid ${g.isCompanion ? 'rgba(167,139,250,0.2)' : 'rgba(200,169,110,0.2)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.6rem', fontWeight: 600,
                            color: g.isCompanion ? '#A78BFA' : 'var(--gold)',
                          }}>
                            {g.isCompanion ? <UserPlus size={12} /> : <>{g.firstName?.[0]}{g.lastName?.[0]}</>}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              {g.firstName} {g.lastName}
                              {g.isCompanion && <span style={{ fontSize: '0.55rem', fontWeight: 600, padding: '0.05rem 0.3rem', borderRadius: 4, background: 'rgba(167,139,250,0.1)', color: '#A78BFA' }}>{tr.companion}</span>}
                            </div>
                            {g.group && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{g.group}</div>}
                          </div>
                        </div>
                        <Plus size={14} style={{ color: 'var(--gold)', opacity: 0.7 }} />
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Table Modal */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)}>
              <motion.div className="modal" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl font-semibold">{tr.createTable}</h2>
                  <button className="btn-ghost p:1.5" onClick={() => setShowAddModal(false)}><X size={18} /></button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="label">{tr.nameRequired}</label>
                    <input className="input" placeholder="Table 1" value={newTable.name} onChange={e => setNewTable(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">{tr.capacityRequired}</label>
                    <input className="input" type="number" min={1} value={newTable.capacity} onChange={e => setNewTable(p => ({ ...p, capacity: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="label">{tr.shape}</label>
                    <select className="input" value={newTable.shape} onChange={e => setNewTable(p => ({ ...p, shape: e.target.value as any }))}>
                      <option value="round">{tr.round}</option>
                      <option value="rectangle">{tr.rectangle}</option>
                      <option value="square">{tr.square}</option>
                    </select>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button className="btn-secondary flex-1" onClick={() => setShowAddModal(false)}>{tr.cancel}</button>
                    <button className="btn-primary flex-1" onClick={handleAddTable}>{tr.save}</button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Smart Organization Modal ──────────────────── */}
        <AnimatePresence>
          {showSmartModal && (
            <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSmartModal(false)}>
              <motion.div
                className="modal"
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: 520 }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: 'linear-gradient(135deg, rgba(200,169,110,0.15), rgba(200,169,110,0.05))',
                      border: '1.5px solid rgba(200,169,110,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Zap size={18} style={{ color: 'var(--gold)' }} />
                    </div>
                    <div>
                      <h2 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>{tr.smartOrgTitle}</h2>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0.1rem 0 0' }}>
                        {tr.smartOrgDesc}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setShowSmartModal(false)} style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <X size={16} />
                  </button>
                </div>

                {/* Capacity input */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '0.4rem' }}>{tr.persPerTable}</label>
                  <input
                    className="input"
                    type="number" min={2} max={20}
                    value={smartCapacity}
                    onChange={e => setSmartCapacity(Math.max(2, Number(e.target.value)))}
                    style={{ fontSize: '1.1rem', fontWeight: 600, textAlign: 'center' }}
                  />
                </div>

                {/* Preview */}
                {(() => {
                  const grouped = {} as Record<string, number>;
                  allRows.forEach(g => {
                    const grp = g.group || tr.noGroup;
                    grouped[grp] = (grouped[grp] || 0) + 1;
                  });
                  const totalTables = Object.values(grouped).reduce((acc, n) => acc + Math.ceil(n / smartCapacity), 0);
                  const groupEntries = Object.entries(grouped);

                  return (
                    <div style={{ background: 'var(--glass)', border: '1px solid var(--border-light)', borderRadius: 12, padding: '1rem', marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{tr.previewTitle}</span>
                        <span style={{
                          fontSize: '0.65rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: 20,
                          background: 'rgba(200,169,110,0.1)', color: 'var(--gold)', border: '1px solid rgba(200,169,110,0.2)',
                        }}>
                          {tr.tablesToCreate.replace('{n}', String(totalTables))}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {groupEntries.map(([name, count]) => {
                          const numT = Math.ceil(count / smartCapacity);
                          const matchingGroup = guestGroups.find(g => g.name === name);
                          return (
                            <div key={name} style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '0.4rem 0.6rem', borderRadius: 8, background: 'var(--bg-card)',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span style={{ fontSize: '0.85rem' }}>{matchingGroup?.emoji || '👥'}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>{name}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{count} {tr.pers}</span>
                                <span style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--gold)' }}>{tr.arrowTables.replace('{n}', String(numT))}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Warning */}
                {tables.length > 0 && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.6rem 0.8rem', borderRadius: 10, marginBottom: '1rem',
                    background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)',
                  }}>
                    <Clock size={14} style={{ color: '#F59E0B', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.7rem', color: '#F59E0B' }}>
                      {tr.smartWarning}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setShowSmartModal(false)}
                    style={{
                      flex: 1, padding: '0.65rem', borderRadius: 10, border: '1px solid var(--border-light)',
                      background: 'var(--glass)', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                    }}
                  >{tr.cancel}</button>
                  <button
                    onClick={smartOrganize}
                    disabled={allRows.length === 0}
                    style={{
                      flex: 1, padding: '0.65rem', borderRadius: 10, border: 'none',
                      background: allRows.length === 0 ? 'var(--glass)' : 'linear-gradient(135deg, var(--gold), var(--gold-light))',
                      color: allRows.length === 0 ? 'var(--text-muted)' : '#fff',
                      fontWeight: 600, fontSize: '0.8rem', cursor: allRows.length === 0 ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                    }}
                  >
                    <Sparkles size={14} /> {tr.apply}
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
