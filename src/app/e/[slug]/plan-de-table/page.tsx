'use client';

import React, { use, useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  Sparkles,
  Search,
  Users,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Utensils,
  CheckCircle2,
  Info,
} from 'lucide-react';
import Link from 'next/link';

interface TableData {
  id: string;
  eventId: string;
  name: string;
  capacity: number;
  shape: 'round' | 'rectangle' | 'square';
  positionX: number;
  positionY: number;
  guestIds: string[];
}

interface GuestData {
  id: string;
  firstName: string;
  lastName: string;
  group: string;
  tableId?: string;
  companions: number;
}

interface GroupData {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

function SeatingPlanContent({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const guestParam = searchParams.get('guest') || '';

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);
  const [tables, setTables] = useState<TableData[]>([]);
  const [guests, setGuests] = useState<GuestData[]>([]);
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [currentGuest, setCurrentGuest] = useState<any>(null);
  const [currentTable, setCurrentTable] = useState<TableData | null>(null);

  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load seating data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/seating?slug=${encodeURIComponent(slug)}&token=${encodeURIComponent(token)}`);
        if (!res.ok) throw new Error('Erreur de chargement');
        const data = await res.json();

        setEvent(data.event);
        setTables(data.tables || []);
        setGuests(data.guests || []);
        setGroups(data.groups || []);

        let guestObj = data.currentGuest;
        let tableObj = data.currentTable;

        // Fallback: match by URL name if token didn't resolve guest
        if (!guestObj && guestParam) {
          const rawName = decodeURIComponent(guestParam).toLowerCase().replace(/-/g, ' ');
          const match = (data.guests || []).find((g: GuestData) => {
            const full = `${g.firstName} ${g.lastName}`.toLowerCase();
            return full.includes(rawName) || rawName.includes(g.firstName.toLowerCase());
          });
          if (match) {
            const table = (data.tables || []).find((t: TableData) => t.id === match.tableId || t.guestIds.includes(match.id));
            const grp = (data.groups || []).find((gr: GroupData) => gr.name === match.group);
            guestObj = {
              id: match.id,
              firstName: match.firstName,
              lastName: match.lastName,
              group: match.group || 'Invités',
              groupEmoji: grp?.emoji || '👥',
              groupColor: grp?.color || '#C8A96E',
              tableId: table?.id || null,
              tableName: table?.name || null,
              companions: match.companions || 0,
            };
            tableObj = table || null;
          }
        }

        setCurrentGuest(guestObj);
        setCurrentTable(tableObj);
        if (tableObj) {
          setSelectedTable(tableObj);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [slug, token, guestParam]);

  // Center on guest's table initially
  useEffect(() => {
    if (currentTable && containerRef.current) {
      setTimeout(() => {
        const targetX = currentTable.positionX || 0;
        const targetY = currentTable.positionY || 0;
        containerRef.current?.scrollTo({
          left: Math.max(0, targetX - 100),
          top: Math.max(0, targetY - 100),
          behavior: 'smooth',
        });
      }, 350);
    }
  }, [currentTable]);

  // Handle guest search filter
  const searchedGuest = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();
    return guests.find(g => `${g.firstName} ${g.lastName}`.toLowerCase().includes(q));
  }, [searchQuery, guests]);

  const activeHighlightedTableId = useMemo(() => {
    if (searchedGuest?.tableId) return searchedGuest.tableId;
    if (currentTable?.id) return currentTable.id;
    if (currentGuest?.tableId) return currentGuest.tableId;
    return null;
  }, [searchedGuest, currentTable, currentGuest]);

  // Calculate canvas bounding box so all tables fit
  const canvasDimensions = useMemo(() => {
    let maxX = 800;
    let maxY = 600;
    tables.forEach(t => {
      if ((t.positionX || 0) + 240 > maxX) maxX = (t.positionX || 0) + 240;
      if ((t.positionY || 0) + 240 > maxY) maxY = (t.positionY || 0) + 240;
    });
    return { width: Math.max(1000, maxX), height: Math.max(750, maxY) };
  }, [tables]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0E0C] text-white flex flex-col items-center justify-center p-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 rounded-full border-2 border-[#D4AF37] border-t-transparent mb-4"
        />
        <p className="text-sm text-[#C8A96E] font-medium tracking-wide">Chargement du plan de table...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E0D0B] text-white flex flex-col selection:bg-[#EF4444] selection:text-white">
      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-30 bg-[#161412]/95 backdrop-blur-md border-b border-[#C8A96E]/20 px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href={`/e/${slug}${token ? `?token=${token}` : ''}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-medium transition-all text-white/80 hover:text-white"
            >
              <ArrowLeft size={14} />
              <span>Retour à l'invitation</span>
            </Link>

            <div>
              <h1 className="font-serif text-lg sm:text-xl font-bold tracking-wide text-[#F3E5AB]">
                Plan de Table
              </h1>
              <p className="text-xs text-white/50">{event?.name || 'Réception'}</p>
            </div>
          </div>

          {/* Search bar for guests */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Chercher votre nom..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs focus:outline-none focus:border-[#D4AF37] transition-all text-white placeholder-white/30"
              />
            </div>

            {/* Zoom controls */}
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
              <button
                onClick={() => setZoomLevel(prev => Math.max(0.6, prev - 0.15))}
                className="p-1 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-all"
                title="Dézoomer"
              >
                <ZoomOut size={15} />
              </button>
              <span className="text-[10px] font-mono px-1 text-white/60">{Math.round(zoomLevel * 100)}%</span>
              <button
                onClick={() => setZoomLevel(prev => Math.min(1.6, prev + 0.15))}
                className="p-1 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-all"
                title="Zoomer"
              >
                <ZoomIn size={15} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Guest Status Highlight Banner ── */}
      {(currentGuest || searchedGuest) && (
        <div className="bg-gradient-to-r from-red-950/50 via-[#1C1815] to-amber-950/40 border-b border-red-500/30 px-4 py-2.5 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-red-600/20 border border-red-500/50 flex items-center justify-center text-red-400 shrink-0">
                <MapPin size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">
                    {searchedGuest ? `${searchedGuest.firstName} ${searchedGuest.lastName}` : `Bonjour ${currentGuest.firstName} ${currentGuest.lastName}`}
                  </span>
                  {currentGuest?.group && (
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                      style={{
                        background: `${currentGuest.groupColor || '#C8A96E'}20`,
                        color: currentGuest.groupColor || '#C8A96E',
                        border: `1px solid ${currentGuest.groupColor || '#C8A96E'}40`,
                      }}
                    >
                      {currentGuest.groupEmoji} {currentGuest.group}
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/70">
                  Votre place est à la :{' '}
                  <span className="font-bold text-red-400 underline decoration-red-400/50">
                    {tables.find(t => t.id === activeHighlightedTableId)?.name || 'Non attribuée'}
                  </span>
                </p>
              </div>
            </div>

            {activeHighlightedTableId && (
              <button
                onClick={() => {
                  const target = tables.find(t => t.id === activeHighlightedTableId);
                  if (target) {
                    setSelectedTable(target);
                    containerRef.current?.scrollTo({
                      left: Math.max(0, target.positionX - 100),
                      top: Math.max(0, target.positionY - 100),
                      behavior: 'smooth',
                    });
                  }
                }}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-all shadow-lg shadow-red-900/30 self-start sm:self-auto"
              >
                <MapPin size={13} />
                <span>Centrer sur ma table</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Main Canvas View ── */}
      <main className="flex-1 relative flex flex-col md:flex-row overflow-hidden">
        {/* Floor plan area */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto p-6 relative cursor-grab active:cursor-grabbing"
          style={{
            backgroundImage: `radial-gradient(rgba(200, 169, 110, 0.08) 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        >
          {/* Stage / Mariés indicator */}
          <div className="mb-6 flex justify-center">
            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-[#1F1B16] border border-[#C8A96E]/30 text-xs font-semibold tracking-widest uppercase text-[#D4AF37] shadow-lg">
              <Sparkles size={14} />
              <span>Scène & Estrade d'Honneur</span>
              <Sparkles size={14} />
            </div>
          </div>

          {/* Scalable Room Layout */}
          <div
            style={{
              width: `${canvasDimensions.width}px`,
              height: `${canvasDimensions.height}px`,
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top left',
              transition: 'transform 0.15s ease-out',
              position: 'relative',
            }}
          >
            {tables.map((t) => {
              const isUserTable = t.id === activeHighlightedTableId;
              const isSelected = selectedTable?.id === t.id;
              const posX = t.positionX || 0;
              const posY = t.positionY || 0;

              // Border radius by shape
              let borderRadius = '50%';
              if (t.shape === 'square') borderRadius = '16px';
              if (t.shape === 'rectangle') borderRadius = '20px';

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTable(t)}
                  style={{
                    position: 'absolute',
                    left: `${posX}px`,
                    top: `${posY}px`,
                    transform: 'translate(0, 0)',
                    zIndex: isUserTable ? 20 : isSelected ? 15 : 5,
                  }}
                  className="cursor-pointer group"
                >
                  {/* Floating Marker if this is user table */}
                  {isUserTable && (
                    <motion.div
                      initial={{ y: -5 }}
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute -top-12 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-red-600 text-white font-extrabold text-[11px] uppercase tracking-wider shadow-xl shadow-red-900/60 border border-white/20">
                        <MapPin size={12} className="animate-pulse" />
                        <span>VOUS ÊTES ICI</span>
                      </div>
                      <div className="w-2 h-2 bg-red-600 rotate-45 -mt-1 shadow-md" />
                    </motion.div>
                  )}

                  {/* Pulsating Ring for Guest Table */}
                  {isUserTable && (
                    <div
                      className="absolute -inset-3 rounded-full animate-ping pointer-events-none opacity-40"
                      style={{
                        background: 'radial-gradient(circle, #EF4444 0%, transparent 70%)',
                        borderRadius: borderRadius,
                      }}
                    />
                  )}

                  {/* The Table Element */}
                  <div
                    style={{
                      width: t.shape === 'rectangle' ? '160px' : '110px',
                      height: '110px',
                      borderRadius: borderRadius,
                      background: isUserTable
                        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.4) 0%, rgba(153, 27, 27, 0.65) 100%)'
                        : isSelected
                        ? 'linear-gradient(135deg, rgba(200, 169, 110, 0.3) 0%, rgba(138, 107, 43, 0.4) 100%)'
                        : 'linear-gradient(135deg, rgba(35, 30, 25, 0.85) 0%, rgba(20, 18, 15, 0.95) 100%)',
                      border: isUserTable
                        ? '3px solid #EF4444'
                        : isSelected
                        ? '2.5px solid #D4AF37'
                        : '1.5px solid rgba(200, 169, 110, 0.3)',
                      boxShadow: isUserTable
                        ? '0 0 35px rgba(239, 68, 68, 0.6), inset 0 0 15px rgba(239, 68, 68, 0.3)'
                        : isSelected
                        ? '0 0 20px rgba(212, 175, 55, 0.4)'
                        : '0 8px 16px rgba(0, 0, 0, 0.4)',
                    }}
                    className="flex flex-col items-center justify-center p-3 text-center transition-all duration-200 group-hover:scale-105"
                  >
                    <Utensils
                      size={isUserTable ? 22 : 18}
                      className={isUserTable ? 'text-red-200 mb-1' : 'text-[#D4AF37] mb-1 opacity-80'}
                    />
                    <span
                      className={`text-xs font-bold leading-tight line-clamp-2 ${
                        isUserTable ? 'text-white' : 'text-white/90'
                      }`}
                    >
                      {t.name}
                    </span>
                    <span
                      className={`text-[10px] font-medium mt-1 ${
                        isUserTable ? 'text-red-200' : 'text-[#C8A96E]'
                      }`}
                    >
                      {t.guestIds.length}/{t.capacity} places
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Sidebar / Bottom Drawer for Selected Table ── */}
        <AnimatePresence>
          {selectedTable && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full md:w-80 lg:w-96 bg-[#161412] border-t md:border-t-0 md:border-l border-[#C8A96E]/20 p-5 flex flex-col justify-between shrink-0 shadow-2xl z-20"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        selectedTable.id === activeHighlightedTableId
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                          : 'bg-[#C8A96E]/15 text-[#D4AF37] border border-[#C8A96E]/30'
                      }`}
                    >
                      <Utensils size={18} />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-base text-white">
                        {selectedTable.name}
                      </h3>
                      <p className="text-[11px] text-white/50">
                        Capacité : {selectedTable.capacity} personnes
                      </p>
                    </div>
                  </div>

                  {selectedTable.id === activeHighlightedTableId && (
                    <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-extrabold text-[10px] uppercase tracking-wide">
                      Votre Table
                    </span>
                  )}
                </div>

                {selectedTable.id === activeHighlightedTableId && (
                  <div className="rounded-xl p-3 bg-red-950/40 border border-red-500/30 text-xs text-red-200 mb-4 flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-red-400 shrink-0 mt-0.5" />
                    <span>C'est votre table réservée pour toute la soirée ! Vos proches et convives s'installeront ici.</span>
                  </div>
                )}

                {/* Seated Guests at this table */}
                <h4 className="text-xs uppercase tracking-wider font-semibold text-white/60 mb-2.5 flex items-center gap-1.5">
                  <Users size={13} className="text-[#C8A96E]" />
                  <span>Convives à cette table ({selectedTable.guestIds.length})</span>
                </h4>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {selectedTable.guestIds.length === 0 ? (
                    <p className="text-xs text-white/40 italic py-2">Aucun invité assigné pour le moment.</p>
                  ) : (
                    selectedTable.guestIds.map((gid) => {
                      const pureId = gid.includes('-comp-') ? gid.split('-comp-')[0] : gid;
                      const g = guests.find((x) => x.id === pureId);
                      const isMe = currentGuest?.id === pureId;
                      const isCompanion = gid.includes('-comp-');
                      const compIndex = isCompanion ? gid.split('-comp-')[1] : null;

                      return (
                        <div
                          key={gid}
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                            isMe
                              ? 'bg-red-950/30 border-red-500/40 text-white font-semibold'
                              : 'bg-white/5 border-white/5 text-white/80'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-[#C8A96E]">
                              {isCompanion ? 'A' : (g?.firstName?.[0] || 'I')}
                            </div>
                            <div>
                              <span>
                                {isCompanion
                                  ? `Accompagnant ${(Number(compIndex) || 0) + 1} (${g?.lastName || ''})`
                                  : g ? `${g.firstName} ${g.lastName}` : 'Invité'}
                              </span>
                              {isMe && (
                                <span className="ml-2 text-[10px] px-1.5 py-0.2 rounded bg-red-600 text-white font-bold">
                                  VOUS
                                </span>
                              )}
                            </div>
                          </div>

                          {g?.group && (
                            <span className="text-[10px] text-white/40">
                              {g.group}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Bottom return button */}
              <div className="mt-5 pt-3 border-t border-white/10">
                <Link
                  href={`/e/${slug}${token ? `?token=${token}` : ''}`}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-black font-semibold text-xs transition-all shadow-md hover:scale-[1.01]"
                >
                  <ArrowLeft size={14} />
                  <span>Revenir à l'invitation principale</span>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function SeatingPlanPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0F0E0C] text-white flex items-center justify-center">
          <p className="text-sm text-[#C8A96E]">Chargement du plan de table...</p>
        </div>
      }
    >
      <SeatingPlanContent slug={slug} />
    </Suspense>
  );
}
