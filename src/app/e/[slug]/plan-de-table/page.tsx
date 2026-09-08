'use client';

import React, { use, useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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

interface FloorPlanElementData {
  id: string;
  name: string;
  type?: string;
  icon?: string;
  positionX: number;
  positionY: number;
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
  const [floorPlanElements, setFloorPlanElements] = useState<FloorPlanElementData[]>([]);
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

        const rawElements = data.event?.floorPlanElements || [];
        setFloorPlanElements(
          rawElements.length > 0
            ? rawElements
            : [{ id: 'default-stage', name: "SCÈNE & ESTRADE D'HONNEUR", icon: "✦", positionX: 420, positionY: 30, type: 'stage' }]
        );

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
        } else if (data.tables && data.tables.length > 0) {
          setSelectedTable(data.tables[0]);
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
        centerOnTable(currentTable);
      }, 350);
    }
  }, [currentTable]);

  // Center helper
  const centerOnTable = (table: TableData) => {
    if (!containerRef.current) return;
    const targetX = table.positionX || 0;
    const targetY = table.positionY || 0;
    containerRef.current.scrollTo({
      left: Math.max(0, targetX - 80),
      top: Math.max(0, targetY - 60),
      behavior: 'smooth',
    });
  };

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

  // Normalized table coordinates
  const canvasDimensions = useMemo(() => {
    let maxX = 900;
    let maxY = 550;
    tables.forEach(t => {
      if ((t.positionX || 0) + 240 > maxX) maxX = (t.positionX || 0) + 240;
      if ((t.positionY || 0) + 220 > maxY) maxY = (t.positionY || 0) + 220;
    });
    floorPlanElements.forEach(elem => {
      if ((elem.positionX || 0) + 280 > maxX) maxX = (elem.positionX || 0) + 280;
      if ((elem.positionY || 0) + 120 > maxY) maxY = (elem.positionY || 0) + 120;
    });
    return { width: Math.max(1100, maxX), height: Math.max(700, maxY) };
  }, [tables, floorPlanElements]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FBF6EE',
        fontFamily: "'Jost', sans-serif",
        color: '#B8863C',
      }}>
        <p style={{ fontSize: '15px', letterSpacing: '.04em' }}>Chargement du plan de table...</p>
      </div>
    );
  }

  const userTable = tables.find(t => t.id === activeHighlightedTableId);

  return (
    <div className="seating-plan-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Cormorant:ital@1&family=Jost:wght@400;500;600&display=swap');

        .seating-plan-wrapper {
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
          --accent: #C4633F;
          --accent-fond: #FBEBE3;

          font-family: 'Jost', sans-serif;
          color: var(--encre);
          background:
            radial-gradient(ellipse at top left, #FFFDF8 0%, transparent 55%),
            radial-gradient(ellipse at bottom right, #F6EEDD 0%, transparent 55%),
            var(--ivoire);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        /* ---------- HEADER ---------- */
        .seating-plan-wrapper header {
          background: var(--ivoire-carte);
          border-bottom: 1px solid var(--trait);
          padding: 16px 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        .seating-plan-wrapper .retour {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13.5px;
          color: var(--encre-douce);
          cursor: pointer;
          white-space: nowrap;
          text-decoration: none;
        }
        .seating-plan-wrapper .retour svg { width: 16px; height: 16px; }
        .seating-plan-wrapper .retour:hover { color: var(--encre); }

        .seating-plan-wrapper .titre-bloc { text-align: center; flex: 1; }
        .seating-plan-wrapper .titre-bloc h1 {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 700;
          font-size: 26px;
          color: var(--encre);
          line-height: 1.1;
        }
        .seating-plan-wrapper .titre-bloc p {
          font-family: 'Cormorant', serif;
          font-style: italic;
          font-size: 14px;
          color: var(--or);
          margin-top: 2px;
        }

        .seating-plan-wrapper .header-droite {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .seating-plan-wrapper .recherche {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--ivoire);
          border: 1px solid var(--trait);
          border-radius: 999px;
          padding: 9px 16px;
          width: 220px;
        }
        .seating-plan-wrapper .recherche svg { width: 14px; height: 14px; color: var(--encre-douce); flex-shrink: 0; }
        .seating-plan-wrapper .recherche input {
          border: none; background: transparent; outline: none;
          font-family: 'Jost', sans-serif; font-size: 13px; color: var(--encre);
          width: 100%;
        }
        .seating-plan-wrapper .recherche input::placeholder { color: #B3A996; }

        .seating-plan-wrapper .zoom {
          display: flex; align-items: center; gap: 8px;
          background: var(--ivoire);
          border: 1px solid var(--trait);
          border-radius: 999px;
          padding: 8px 12px;
          font-size: 12.5px;
          color: var(--encre-douce);
          user-select: none;
        }
        .seating-plan-wrapper .zoom svg { width: 15px; height: 15px; cursor: pointer; color: var(--encre-douce); }
        .seating-plan-wrapper .zoom svg:hover { color: var(--or); }

        /* ---------- BANNIÈRE PERSO ---------- */
        .seating-plan-wrapper .banniere {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          background: var(--or-fond);
          border-bottom: 1px solid var(--or-clair);
          padding: 12px 28px;
          flex-wrap: wrap;
        }
        .seating-plan-wrapper .banniere-gauche { display: flex; align-items: center; gap: 12px; }
        .seating-plan-wrapper .banniere-icone {
          width: 34px; height: 34px;
          border-radius: 50%;
          background: var(--ivoire-carte);
          border: 1px solid var(--or-clair);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .seating-plan-wrapper .banniere-icone svg { width: 16px; height: 16px; color: var(--or); }
        .seating-plan-wrapper .banniere-texte .ligne1 {
          font-size: 14px; font-weight: 600; color: var(--encre);
          display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
        }
        .seating-plan-wrapper .badge-famille {
          display: inline-flex; align-items: center; gap: 5px;
          background: var(--bleu-fond); color: var(--bleu-etiquette);
          font-size: 11.5px; font-weight: 500;
          padding: 3px 10px; border-radius: 999px;
          border: 1px solid #DCE3ED;
        }
        .seating-plan-wrapper .banniere-texte .ligne2 {
          font-size: 12.5px; color: var(--encre-douce); margin-top: 2px;
        }
        .seating-plan-wrapper .banniere-texte .ligne2 strong { color: var(--or); font-weight: 600; }

        .seating-plan-wrapper .btn-centrer {
          display: flex; align-items: center; gap: 7px;
          background: var(--accent);
          color: #fff;
          border: none;
          padding: 10px 18px;
          border-radius: 999px;
          font-size: 13px; font-weight: 500;
          cursor: pointer;
          box-shadow: 0 8px 16px -8px rgba(196,99,63,0.5);
          white-space: nowrap;
          transition: transform .15s ease, opacity .15s ease;
        }
        .seating-plan-wrapper .btn-centrer:active { transform: translateY(1px); }
        .seating-plan-wrapper .btn-centrer svg { width: 14px; height: 14px; }

        /* ---------- ZONE PRINCIPALE ---------- */
        .seating-plan-wrapper .zone-principale {
          flex: 1;
          display: flex;
          overflow: hidden;
          position: relative;
        }

        .seating-plan-wrapper .canvas {
          flex: 1;
          position: relative;
          background-image: radial-gradient(circle, #E7DCC5 1px, transparent 1px);
          background-size: 22px 22px;
          overflow: auto;
          padding: 40px 360px 160px 40px;
          min-height: 600px;
          transition: padding-right 0.2s ease;
        }
        .seating-plan-wrapper .canvas.sans-sidebar {
          padding-right: 60px;
        }

        .seating-plan-wrapper .label-repere {
          position: absolute;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: var(--ivoire-carte);
          border: 1.5px dashed var(--or);
          padding: 7px 16px;
          border-radius: 999px;
          font-family: 'Jost', sans-serif;
          font-size: 11.5px;
          letter-spacing: .06em;
          font-weight: 600;
          color: var(--or);
          white-space: nowrap;
          z-index: 3;
          box-shadow: 0 4px 14px rgba(184,134,60,0.08);
          user-select: none;
          pointer-events: none;
        }
        .seating-plan-wrapper .label-repere.stage {
          background: var(--ivoire-carte);
          border: 1.5px solid var(--or-clair);
          font-size: 12px;
          letter-spacing: .08em;
          box-shadow: 0 6px 18px rgba(184,134,60,0.12);
        }
        .seating-plan-wrapper .label-repere .repere-icon {
          font-size: 13px;
        }

        .seating-plan-wrapper .tag-ici {
          position: absolute;
          display: flex; flex-direction: column; align-items: center;
          z-index: 10;
          pointer-events: none;
          transform: translate(-50%, -100%);
          margin-top: -12px;
        }
        .seating-plan-wrapper .tag-ici .pastille {
          display: flex; align-items: center; gap: 6px;
          background: var(--accent);
          color: #fff;
          font-size: 11px; font-weight: 600; letter-spacing: .05em;
          padding: 6px 14px;
          border-radius: 999px;
          box-shadow: 0 6px 14px -4px rgba(196,99,63,0.6);
          white-space: nowrap;
        }
        .seating-plan-wrapper .tag-ici .pastille svg { width: 12px; height: 12px; }
        .seating-plan-wrapper .tag-ici .fleche {
          width: 2px; height: 14px;
          background: var(--accent);
          margin-top: 2px;
        }

        .seating-plan-wrapper .table {
          position: absolute;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center;
          background: var(--ivoire-carte);
          border: 1px solid var(--trait);
          box-shadow: 0 6px 16px -8px rgba(60,45,20,0.12);
          transition: transform .15s ease, box-shadow .15s ease;
          cursor: pointer;
          user-select: none;
        }
        .seating-plan-wrapper .table:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 22px -10px rgba(60,45,20,0.18);
        }
        .seating-plan-wrapper .table svg { width: 20px; height: 20px; color: var(--or); margin-bottom: 6px; }
        .seating-plan-wrapper .table .nom { font-size: 13.5px; font-weight: 600; color: var(--encre); line-height: 1.25; padding: 0 8px; }
        .seating-plan-wrapper .table .places { font-size: 11.5px; color: var(--encre-douce); margin-top: 2px; }

        .seating-plan-wrapper .table.carre { border-radius: 20px; width: 150px; height: 130px; }
        .seating-plan-wrapper .table.rond { border-radius: 50%; width: 150px; height: 150px; }

        .seating-plan-wrapper .table.active {
          border: 2px solid var(--accent);
          box-shadow: 0 0 0 6px var(--accent-fond), 0 14px 26px -10px rgba(196,99,63,0.45);
        }
        .seating-plan-wrapper .table.active .nom { color: var(--accent); }
        .seating-plan-wrapper .table.active svg { color: var(--accent); }

        /* ---------- SIDEBAR ---------- */
        .seating-plan-wrapper .sidebar {
          width: 320px;
          flex-shrink: 0;
          background: var(--ivoire-carte);
          border-left: 1px solid var(--trait);
          display: flex;
          flex-direction: column;
          z-index: 20;
          position: relative;
          box-shadow: -4px 0 20px rgba(60,45,20,0.04);
        }

        .seating-plan-wrapper .drawer-handle {
          display: none;
        }

        .seating-plan-wrapper .btn-fermer-sidebar {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--ivoire);
          border: 1px solid var(--trait);
          color: var(--encre-douce);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all .15s ease;
          z-index: 10;
        }
        .seating-plan-wrapper .btn-fermer-sidebar:hover {
          background: var(--or-fond);
          color: var(--encre);
          border-color: var(--or);
        }
        .seating-plan-wrapper .btn-fermer-sidebar svg {
          width: 14px;
          height: 14px;
        }

        .seating-plan-wrapper .btn-flottant-revoir-table {
          position: fixed;
          bottom: 24px;
          right: 24px;
          display: inline-flex;
          align-items: center;
          gap: 9px;
          background: var(--ivoire-carte);
          border: 1.5px solid var(--or);
          color: var(--encre);
          padding: 10px 18px;
          border-radius: 999px;
          font-family: 'Jost', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 10px 25px -5px rgba(60,45,20,0.18), 0 0 0 3px rgba(200,169,110,0.12);
          z-index: 40;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .seating-plan-wrapper .btn-flottant-revoir-table:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 30px -5px rgba(60,45,20,0.25), 0 0 0 5px rgba(200,169,110,0.22);
          background: #fff;
        }
        .seating-plan-wrapper .btn-flottant-revoir-table svg {
          width: 16px;
          height: 16px;
          color: var(--or);
        }

        .seating-plan-wrapper .sidebar-contenu {
          padding: 22px 20px;
          flex: 1;
          overflow-y: auto;
        }

        .seating-plan-wrapper .sidebar-entete {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
          padding-right: 32px;
        }
        .seating-plan-wrapper .sidebar-icone {
          width: 42px; height: 42px;
          border-radius: 14px;
          background: var(--accent-fond);
          border: 1px solid #E9C8B7;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .seating-plan-wrapper .sidebar-icone svg { width: 19px; height: 19px; color: var(--accent); }
        .seating-plan-wrapper .sidebar-entete h2 {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 700;
          font-size: 19px;
          color: var(--encre);
          line-height: 1.15;
        }
        .seating-plan-wrapper .sidebar-entete p {
          font-size: 12px; color: var(--encre-douce); margin-top: 1px;
        }

        .seating-plan-wrapper .badge-votre-table {
          display: inline-block;
          background: var(--accent);
          color: #fff;
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: .04em;
          padding: 4px 10px;
          border-radius: 999px;
          margin-bottom: 16px;
        }

        .seating-plan-wrapper .info-box {
          background: var(--accent-fond);
          border-left: 3px solid var(--accent);
          border-radius: 0 10px 10px 0;
          padding: 10px 12px;
          font-size: 11.5px;
          color: var(--encre);
          line-height: 1.45;
          margin-bottom: 18px;
          display: flex;
          gap: 8px;
          align-items: flex-start;
        }
        .seating-plan-wrapper .info-box svg {
          width: 15px; height: 15px;
          color: var(--accent);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .seating-plan-wrapper .section-titre {
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: .08em;
          color: var(--or);
          margin-bottom: 10px;
          display: flex; align-items: center; gap: 6px;
        }
        .seating-plan-wrapper .section-titre svg { width: 13px; height: 13px; }

        .seating-plan-wrapper .convive {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 7px 0;
          border-bottom: 1px dashed var(--trait);
        }
        .seating-plan-wrapper .convive:last-child { border-bottom: none; }
        .seating-plan-wrapper .avatar {
          width: 28px; height: 28px;
          border-radius: 50%;
          background: var(--or-fond);
          border: 1px solid var(--or-clair);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 600; color: var(--or);
          flex-shrink: 0;
        }
        .seating-plan-wrapper .convive-nom {
          font-size: 13.5px; font-weight: 500; color: var(--encre);
          display: flex; align-items: center; gap: 6px;
        }
        .seating-plan-wrapper .vous-tag {
          font-size: 9.5px; font-weight: 700;
          color: var(--accent);
          letter-spacing: .03em;
        }
        .seating-plan-wrapper .convive-role {
          margin-left: auto;
          font-size: 11.5px;
          color: var(--encre-douce);
          white-space: nowrap;
        }

        .seating-plan-wrapper .sidebar-footer {
          padding: 18px 20px;
          border-top: 1px solid var(--trait);
        }
        .seating-plan-wrapper .btn-retour {
          width: 100%;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          background: linear-gradient(180deg, #C99A4E, var(--or));
          color: #FFFBF2 !important;
          border: none;
          padding: 13px;
          border-radius: 14px;
          font-size: 13.5px; font-weight: 500;
          cursor: pointer;
          box-shadow: 0 10px 18px -8px rgba(184,134,60,0.5);
          text-decoration: none;
          transition: transform .15s ease;
        }
        .seating-plan-wrapper .btn-retour:active { transform: translateY(1px); }
        .seating-plan-wrapper .btn-retour svg { width: 14px; height: 14px; }

        @media (max-width: 900px) {
          .seating-plan-wrapper .sidebar {
            position: fixed;
            bottom: 0; left: 0; right: 0;
            width: 100%;
            max-height: 52vh;
            border-left: none;
            border-top: 1px solid var(--trait);
            border-radius: 20px 20px 0 0;
            box-shadow: 0 -10px 30px rgba(0,0,0,0.18);
            z-index: 60;
          }
          .seating-plan-wrapper .drawer-handle {
            display: block;
            width: 44px;
            height: 4px;
            border-radius: 999px;
            background: #D8CEBC;
            margin: 10px auto 2px auto;
            cursor: pointer;
          }
          .seating-plan-wrapper .canvas {
            padding: 24px 20px 280px 20px !important;
          }
          .seating-plan-wrapper .canvas.sans-sidebar {
            padding-bottom: 90px !important;
          }
          .seating-plan-wrapper .btn-flottant-revoir-table {
            bottom: 16px;
            right: 16px;
            padding: 8px 14px;
            font-size: 12px;
          }
          .seating-plan-wrapper .banniere {
            flex-direction: column; align-items: flex-start;
          }
          .seating-plan-wrapper header {
            padding: 12px 16px;
            flex-wrap: wrap;
          }
          .seating-plan-wrapper .titre-bloc {
            order: -1;
            width: 100%;
            margin-bottom: 6px;
          }
          .seating-plan-wrapper .recherche {
            width: 160px;
          }
        }
      `}</style>

      {/* ---------- HEADER ---------- */}
      <header>
        <Link href={`/e/${slug}${token ? `?token=${token}` : ''}`} className="retour">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Retour à l'invitation
        </Link>

        <div className="titre-bloc">
          <h1>Plan de Table</h1>
          <p>{event?.name || 'Réception de mariage'}</p>
        </div>

        <div className="header-droite">
          <div className="recherche">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Chercher votre nom..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="zoom">
            <svg
              onClick={() => setZoomLevel(prev => Math.max(0.6, prev - 0.15))}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
              <path d="M8 11h6" />
            </svg>
            <span>{Math.round(zoomLevel * 100)}%</span>
            <svg
              onClick={() => setZoomLevel(prev => Math.min(1.5, prev + 0.15))}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
              <path d="M11 8v6M8 11h6" />
            </svg>
          </div>
        </div>
      </header>

      {/* ---------- BANNIÈRE PERSO ---------- */}
      {(currentGuest || searchedGuest) && (
        <div className="banniere">
          <div className="banniere-gauche">
            <div className="banniere-icone">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div className="banniere-texte">
              <div className="ligne1">
                Bonjour {searchedGuest ? `${searchedGuest.firstName} ${searchedGuest.lastName}` : (currentGuest ? `${currentGuest.firstName} ${currentGuest.lastName}` : 'Invité')}
                {(currentGuest?.group || searchedGuest?.group) && (
                  <span className="badge-famille">{currentGuest?.group || searchedGuest?.group}</span>
                )}
              </div>
              <div className="ligne2">
                Votre place est à la : <strong>{userTable ? userTable.name : 'Non attribuée'}</strong>
              </div>
            </div>
          </div>

          {userTable && (
            <button className="btn-centrer" onClick={() => centerOnTable(userTable)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Centrer sur ma table
            </button>
          )}
        </div>
      )}

      {/* ---------- ZONE PRINCIPALE ---------- */}
      <div className="zone-principale">
        <div className={`canvas ${!selectedTable ? 'sans-sidebar' : ''}`} ref={containerRef}>
          <div
            style={{
              position: 'relative',
              width: `${canvasDimensions.width}px`,
              height: `${canvasDimensions.height}px`,
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top left',
              transition: 'transform 0.15s ease-out',
            }}
          >
            {/* Repères personnalisés & Scène (Scène, DJ, Buffet, Toilettes...) */}
            {floorPlanElements.map((elem) => {
              const isStage = elem.type === 'stage' || elem.name.toLowerCase().includes('scène');
              return (
                <div
                  key={elem.id}
                  className={`label-repere ${isStage ? 'stage' : ''}`}
                  style={{
                    position: 'absolute',
                    top: `${elem.positionY}px`,
                    left: `${elem.positionX}px`,
                  }}
                >
                  {elem.icon && <span className="repere-icon">{elem.icon}</span>}
                  <span>{elem.name}</span>
                </div>
              );
            })}

            {tables.map((t, index) => {
              const isUserTable = t.id === activeHighlightedTableId;
              const isSelected = selectedTable?.id === t.id;
              const isRound = t.shape === 'round';

              // Fallback default coordinates if not set in DB
              const fallbackPositions = [
                { x: 130, y: 120 },
                { x: 380, y: 110 },
                { x: 640, y: 100 },
                { x: 880, y: 220 },
                { x: 260, y: 320 },
                { x: 520, y: 320 },
                { x: 780, y: 340 },
              ];
              const posX = t.positionX || fallbackPositions[index % fallbackPositions.length].x;
              const posY = t.positionY || fallbackPositions[index % fallbackPositions.length].y;

              const tableClass = `table ${isRound ? 'rond' : 'carre'} ${isUserTable || isSelected ? 'active' : ''}`;

              return (
                <React.Fragment key={t.id}>
                  {isUserTable && (
                    <div
                      className="tag-ici"
                      style={{
                        top: `${posY}px`,
                        left: `${posX + (isRound ? 75 : 75)}px`,
                      }}
                    >
                      <span className="pastille">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0Z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        VOUS ÊTES ICI
                      </span>
                      <span className="fleche" />
                    </div>
                  )}

                  <div
                    className={tableClass}
                    style={{
                      top: `${posY}px`,
                      left: `${posX}px`,
                      zIndex: isUserTable ? 10 : isSelected ? 8 : 4,
                    }}
                    onClick={() => setSelectedTable(t)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2v8a2 2 0 0 0 4 0V2" />
                      <path d="M8 12v10" />
                      <path d="M18 2c-1.5 1-2 3-2 5s.5 4 2 5c1.5-1 2-3 2-5s-.5-4-2-5Z" />
                      <path d="M18 12v10" />
                    </svg>
                    {(t.name || '').toLowerCase().includes('marié') || (t.name || '').toLowerCase().includes('maries') ? (
                      <>
                        <div className="nom" style={{ color: 'var(--or-dore)', fontWeight: 700 }}>👑 {t.name}</div>
                        <div className="places" style={{ color: 'var(--or-dore)', fontWeight: 600 }}>Table d&apos;Honneur</div>
                      </>
                    ) : (
                      <>
                        <div className="nom">{t.name}</div>
                        <div className="places">{t.guestIds.length}/{t.capacity} places</div>
                      </>
                    )}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ---------- SIDEBAR ---------- */}
        {selectedTable && (
          <aside className="sidebar">
            <div className="drawer-handle" onClick={() => setSelectedTable(null)} />
            <button
              className="btn-fermer-sidebar"
              onClick={() => setSelectedTable(null)}
              title="Fermer les détails"
              aria-label="Fermer les détails"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
            <div className="sidebar-contenu">
              <div className="sidebar-entete">
                <div className="sidebar-icone">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2v8a2 2 0 0 0 4 0V2" />
                    <path d="M8 12v10" />
                    <path d="M18 2c-1.5 1-2 3-2 5s.5 4 2 5c1.5-1 2-3 2-5s-.5-4-2-5Z" />
                    <path d="M18 12v10" />
                  </svg>
                </div>
                <div>
                  <h2>{selectedTable.name}</h2>
                  <p>{(selectedTable.name || '').toLowerCase().includes('marié') || (selectedTable.name || '').toLowerCase().includes('maries') ? "Réservée pour les Mariés" : `Capacité : ${selectedTable.capacity} personnes`}</p>
                </div>
              </div>

              {selectedTable.id === activeHighlightedTableId && (
                <>
                  <span className="badge-votre-table">VOTRE TABLE</span>
                  <div className="info-box">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <path d="m9 11 3 3L22 4" />
                    </svg>
                    C&apos;est votre table réservée pour toute la soirée&nbsp;! Vos proches et convives s&apos;installeront ici.
                  </div>
                </>
              )}

              {(selectedTable.name || '').toLowerCase().includes('marié') || (selectedTable.name || '').toLowerCase().includes('maries') ? (
                <div style={{
                  marginTop: '1.25rem',
                  padding: '1.25rem',
                  borderRadius: '1rem',
                  background: 'rgba(200, 169, 110, 0.08)',
                  border: '1px solid rgba(200, 169, 110, 0.25)',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👑 💍</div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--or-dore)', marginBottom: '0.35rem' }}>
                    Table d&apos;Honneur des Mariés
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--encre-douce)', lineHeight: 1.5, margin: 0 }}>
                    Cette table est spécialement réservée pour les Mariés pour célébrer ce moment inoubliable avec leurs convives.
                  </p>
                </div>
              ) : (
                <>
                  <div className="section-titre">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    CONVIVES À CETTE TABLE ({selectedTable.guestIds.length})
                  </div>

                  <div>
                    {selectedTable.guestIds.length === 0 ? (
                      <p style={{ fontSize: '12.5px', color: 'var(--encre-douce)', fontStyle: 'italic', padding: '8px 0' }}>
                        Aucun invité assigné pour le moment.
                      </p>
                    ) : (
                      selectedTable.guestIds.map((gid) => {
                        const pureId = gid.includes('-comp-') ? gid.split('-comp-')[0] : gid;
                        const g = guests.find((x) => x.id === pureId);
                        const groupObj = groups.find((grp) => grp.name === g?.group);
                        return (
                          <div key={gid} className="carte-convive">
                            <div
                              className="avatar-initiales"
                              style={{
                                background: groupObj ? `${groupObj.color}22` : 'var(--dore-subtil)',
                                color: groupObj?.color || 'var(--or-dore)',
                              }}
                            >
                              {g ? `${g.firstName[0] || ''}${g.lastName[0] || ''}` : '👥'}
                            </div>
                            <div className="convive-infos">
                              <span className="convive-nom">
                                {g ? `${g.firstName} ${g.lastName}` : 'Invité'}
                                {gid.includes('-comp-') && (
                                  <span style={{ fontSize: '10px', color: 'var(--or-dore)', marginLeft: 6, fontWeight: 500 }}>
                                    (Accompagnant)
                                  </span>
                                )}
                              </span>
                              {groupObj && (
                                <span className="convive-groupe">
                                  {groupObj.emoji} {groupObj.name}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="sidebar-footer">
              <Link href={`/e/${slug}${token ? `?token=${token}` : ''}`} className="btn-retour">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Revenir à l'invitation principale
              </Link>
            </div>
          </aside>
        )}

        {/* Bouton flottant pour rouvrir les détails de la table quand la sidebar est fermée */}
        {!selectedTable && (
          <button
            className="btn-flottant-revoir-table"
            onClick={() => setSelectedTable(userTable || tables[0] || null)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2v8a2 2 0 0 0 4 0V2" />
              <path d="M8 12v10" />
              <path d="M18 2c-1.5 1-2 3-2 5s.5 4 2 5c1.5-1 2-3 2-5s-.5-4-2-5Z" />
              <path d="M18 12v10" />
            </svg>
            <span>{userTable ? `Voir ma table (${userTable.name})` : 'Détails de la table'}</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function SeatingPlanPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  return (
    <Suspense
      fallback={
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FBF6EE',
          fontFamily: "'Jost', sans-serif",
          color: '#B8863C',
        }}>
          <p style={{ fontSize: '15px' }}>Chargement du plan de table...</p>
        </div>
      }
    >
      <SeatingPlanContent slug={slug} />
    </Suspense>
  );
}
