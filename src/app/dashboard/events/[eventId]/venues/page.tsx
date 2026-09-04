'use client';
import Sidebar from '@/components/Sidebar';
import EventLoader from '@/components/EventLoader';
import { useApp } from '@/context/AppContext';
import { useThemeLanguage } from '@/context/ThemeLanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { use, useState, useEffect, useRef } from 'react';
import { MapPin, Plus, Edit3, Trash2, X, Navigation, Search, Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import dynamic from 'next/dynamic';

// Dynamically import map components (no SSR)
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });
const useMapEvents = dynamic(() => import('react-leaflet').then(m => m.useMapEvents as any), { ssr: false }) as any;

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.45 } })
};

const emojiOptions = ['📍','⛪','🕌','🏛️','🏨','🍽️','🎪','🌳','🏖️','🎵','💒','🏠','🎭','🏢'];

// Map click handler component
function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  // We'll handle this differently since useMapEvents can't be dynamically imported
  return null;
}

export default function VenuesPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const { events, venues, addVenue, updateVenue, removeVenue, eventsLoading } = useApp();
  const { t } = useThemeLanguage();
  const tr = t('venues');
  const tc = t('common');
  const event = events.find(e => e.id === eventId);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', address: '', emoji: '📍', lat: 5.316, lng: -4.016 });
  const [mapReady, setMapReady] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Import leaflet CSS
    import('leaflet/dist/leaflet.css');
    setMapReady(true);
  }, []);

  const eventVenues = venues.filter(v => v.eventId === eventId);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', address: '', emoji: '📍', lat: 5.316, lng: -4.016 });
    setErrorMessage('');
    setIsSaving(false);
    setShowModal(true);
    setMapKey(k => k + 1);
  };

  const openEdit = (id: string) => {
    const v = venues.find(x => x.id === id);
    if (!v) return;
    setEditing(id);
    setForm({ name: v.name, address: v.address, emoji: v.emoji || '📍', lat: v.lat || 0, lng: v.lng || 0 });
    setErrorMessage('');
    setIsSaving(false);
    setShowModal(true);
    setMapKey(k => k + 1);
  };

  const handleSave = async () => {
    const trimmedName = form.name.trim();
    if (!trimmedName) return;

    // Check duplicate name within this event
    const isDup = eventVenues.some(v => v.id !== editing && v.name.trim().toLowerCase() === trimmedName.toLowerCase());
    if (isDup) {
      setErrorMessage((tr as any).duplicateName || 'Un lieu avec ce nom existe déjà pour cet événement.');
      return;
    }

    setErrorMessage('');
    setIsSaving(true);
    try {
      const finalAddress = form.address.trim() || `${form.lat.toFixed(5)}, ${form.lng.toFixed(5)}`;
      if (editing) {
        await updateVenue(editing, { name: trimmedName, address: finalAddress, emoji: form.emoji, lat: form.lat, lng: form.lng });
      } else {
        const res = await addVenue({ id: crypto.randomUUID(), eventId, name: trimmedName, address: finalAddress, emoji: form.emoji, lat: form.lat, lng: form.lng });
        if (res && !res.success) {
          setErrorMessage(res.error?.message || 'Erreur lors de l\'enregistrement dans la base de données');
          return;
        }
      }
      setShowModal(false);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    removeVenue(id);
  };

  if (!event) return eventsLoading ? <EventLoader /> : <div className="flex"><Sidebar /><main className="main-content"><p>{tc.eventNotFound}</p></main></div>;

  return (
    <div className="flex">
      <Sidebar eventId={eventId} />
      <main className="main-content">
        {/* Header */}
        <motion.div className="venues-header" initial="hidden" animate="visible" variants={fadeUp} custom={0}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 className="font-display text-2xl font-bold" style={{ marginBottom: '0.25rem' }}>{tr.title}</h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              {tr.noVenuesDesc}
            </p>
          </div>
          <button onClick={openAdd} style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.55rem 1rem', borderRadius: 12, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, var(--gold), var(--gold-light))',
            color: '#fff', fontWeight: 600, fontSize: '0.85rem',
          }}><Plus size={16} /> {tr.addVenue}</button>
        </motion.div>

        {/* Venues Grid */}
        <div className="venues-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(250px, 100%), 1fr))', gap: '1.25rem' }}>
          {eventVenues.map((v, i) => (
            <motion.div
              key={v.id}
              initial="hidden" animate="visible" variants={fadeUp} custom={i + 1}
              whileHover={{ y: -3 }}
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-light)',
                borderRadius: '1.25rem', overflow: 'hidden', position: 'relative',
              }}
            >
              {/* Mini map preview */}
              {mapReady && (
                <div style={{ height: 140, position: 'relative', pointerEvents: 'none', zIndex: 0, isolation: 'isolate', overflow: 'hidden', borderRadius: '1.25rem 1.25rem 0 0' }}>
                  <MiniMap lat={v.lat || 0} lng={v.lng || 0} />
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: 40,
                    background: 'linear-gradient(transparent, var(--bg-card))',
                    pointerEvents: 'none',
                  }} />
                </div>
              )}

              <div style={{ padding: '1rem 1.25rem 1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: 'rgba(200,169,110,0.1)', border: '1px solid rgba(200,169,110,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
                    }}>{v.emoji || '📍'}</div>
                    <div>
                      <h3 style={{ fontWeight: 600, fontSize: '0.95rem', margin: 0, color: 'var(--text-primary)' }}>{v.name}</h3>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>{v.address}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.2rem' }}>
                    <button onClick={() => openEdit(v.id)} style={{
                      background: 'none', border: 'none', padding: 5, borderRadius: 6,
                      cursor: 'pointer', color: 'var(--text-muted)', transition: 'color 0.2s',
                    }} onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
                       onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => handleDelete(v.id)} style={{
                      background: 'none', border: 'none', padding: 5, borderRadius: 6,
                      cursor: 'pointer', color: 'var(--text-muted)', transition: 'color 0.2s',
                    }} onMouseEnter={e => e.currentTarget.style.color = '#F87171'}
                       onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.65rem',
                  fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'monospace',
                }}>
                  <Navigation size={10} />
                  {(v.lat || 0).toFixed(4)}, {(v.lng || 0).toFixed(4)}
                </div>
              </div>
            </motion.div>
          ))}

          {eventVenues.length === 0 && (
            <motion.div
              initial="hidden" animate="visible" variants={fadeUp} custom={1}
              style={{
                gridColumn: '1 / -1', textAlign: 'center', padding: '3rem',
                background: 'var(--bg-card)', border: '1px solid var(--border-light)',
                borderRadius: '1.25rem',
              }}
            >
              <MapPin size={36} style={{ color: 'var(--text-muted)', opacity: 0.3, margin: '0 auto 0.75rem' }} />
              <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.3rem' }}>{tr.noVenues}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                {tr.noVenuesDesc}
              </p>
            </motion.div>
          )}
        </div>

        {/* Add/Edit Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)}>
              <motion.div
                className="modal"
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: 520 }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <h2 className="font-display" style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                    {editing ? tr.edit : tr.addVenue}
                  </h2>
                  <button onClick={() => setShowModal(false)} style={{
                    background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 8,
                    width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'var(--text-muted)',
                  }}><X size={16} /></button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {/* Name + Emoji */}
                  <div>
                    <label className="label">{tr.name} *</label>
                    <input className="input" placeholder={tr.namePlaceholder} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">{tr.address} *</label>
                    <input className="input" placeholder={tr.addressPlaceholder} value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
                  </div>

                  {/* Emoji picker */}
                  <div>
                    <label className="label">{tr.icon}</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                      {emojiOptions.map(em => (
                        <button key={em} type="button" onClick={() => setForm(p => ({ ...p, emoji: em }))} style={{
                          width: 36, height: 36, borderRadius: 9, fontSize: '1rem',
                          border: form.emoji === em ? '2px solid var(--gold)' : '1px solid var(--border-light)',
                          background: form.emoji === em ? 'rgba(200,169,110,0.1)' : 'var(--glass)',
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}>{em}</button>
                      ))}
                    </div>
                  </div>

                  {/* Map Picker */}
                  <div>
                    <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <MapPin size={13} style={{ color: 'var(--gold)' }} />
                      {tr.mapPosition}
                    </label>
                    <SearchableMapPicker
                      key={mapKey}
                      lat={form.lat}
                      lng={form.lng}
                      mapReady={mapReady}
                      onSelect={(lat, lng, address) => {
                        setForm(p => ({ ...p, lat, lng, ...(address && !p.address ? { address } : {}) }));
                      }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.4rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      <Navigation size={10} />
                      {tr.coordinates} : {form.lat.toFixed(5)}, {form.lng.toFixed(5)}
                    </div>
                  </div>

                  {errorMessage && (
                    <div style={{
                      color: '#ef4444',
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.25)',
                      borderRadius: 8,
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.75rem',
                    }}>
                      {errorMessage}
                    </div>
                  )}

                  {/* Buttons */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button onClick={() => setShowModal(false)} disabled={isSaving} style={{
                      flex: 1, padding: '0.6rem', borderRadius: 10, border: '1px solid var(--border-light)',
                      background: 'var(--glass)', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.8rem', cursor: isSaving ? 'not-allowed' : 'pointer',
                    }}>{tc.cancel}</button>
                    <button onClick={handleSave} disabled={!form.name.trim() || isSaving} style={{
                      flex: 1, padding: '0.6rem', borderRadius: 10, border: 'none',
                      background: (!form.name.trim() || isSaving) ? 'var(--glass)' : 'linear-gradient(135deg, var(--gold), var(--gold-light))',
                      color: (!form.name.trim() || isSaving) ? 'var(--text-muted)' : '#fff',
                      fontWeight: 600, fontSize: '0.8rem', cursor: (!form.name.trim() || isSaving) ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                    }}>
                      {isSaving && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                      {editing ? tr.save : tc.add}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// Searchable map picker with geocoding
function SearchableMapPicker({ lat, lng, mapReady, onSelect }: {
  lat: number; lng: number; mapReady: boolean;
  onSelect: (lat: number, lng: number, address?: string) => void;
}) {
  const { t } = useThemeLanguage();
  const tr = t('venues');

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const doSearch = async (q: string) => {
    if (q.length < 3) { setResults([]); setShowResults(false); return; }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&accept-language=fr`,
        { headers: { 'User-Agent': 'EventOS/1.0' } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResults(data || []);
      setShowResults(data.length > 0);
    } catch (err) {
      console.warn('Geocoding error:', err);
      setResults([]);
      setShowResults(false);
    } finally { setSearching(false); }
  };

  const handleInput = (val: string) => {
    setQuery(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(val), 400);
  };

  const selectResult = (r: { display_name: string; lat: string; lon: string }) => {
    const la = parseFloat(r.lat);
    const ln = parseFloat(r.lon);
    onSelect(la, ln, r.display_name);
    setQuery(r.display_name.split(',').slice(0, 2).join(','));
    setShowResults(false);
  };

  return (
    <div>
      {/* Search input */}
      <div style={{ marginBottom: '0.5rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            className="input"
            placeholder={tr.searchPlaceholder}
            value={query}
            onChange={e => handleInput(e.target.value)}
            onFocus={() => results.length > 0 && setShowResults(true)}
            style={{ paddingLeft: 32 }}
          />
          {searching && <Loader2 size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gold)', animation: 'spin 1s linear infinite' }} />}
        </div>
        {/* Results list (in flow, not absolute) */}
        {showResults && results.length > 0 && (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-light)',
            borderRadius: 10, marginTop: 6, maxHeight: 180, overflowY: 'auto',
          }}>
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => selectResult(r)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.4rem', width: '100%',
                  padding: '0.55rem 0.75rem', border: 'none', background: 'transparent',
                  textAlign: 'left', cursor: 'pointer', fontSize: '0.75rem',
                  color: 'var(--text-primary)', borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--glass)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <MapPin size={12} style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 2 }} />
                <span style={{ lineHeight: 1.3 }}>{r.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div style={{ height: 220, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-light)' }}>
        {mapReady ? (
          <MapPickerInner lat={lat} lng={lng} onSelect={(la, ln) => { onSelect(la, ln); setShowResults(false); }} />
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--glass)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{tr.loading}</div>
        )}
      </div>
    </div>
  );
}

// Leaflet map picker component (client-only)
function MapPickerInner({ lat, lng, onSelect }: { lat: number; lng: number; onSelect: (lat: number, lng: number) => void }) {
  const { t } = useThemeLanguage();
  const tr = t('venues');
  const [position, setPosition] = useState<[number, number]>([lat, lng]);
  const [leafletReady, setLeafletReady] = useState(false);
  const mapRef = useRef<any>(null);

  // Sync position from parent when search result changes
  useEffect(() => {
    setPosition([lat, lng]);
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lng], 15, { duration: 1 });
    }
  }, [lat, lng]);

  useEffect(() => {
    const L = require('leaflet');
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });
    setLeafletReady(true);
  }, []);

  if (!leafletReady) return <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--glass)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{tr.loadingMap}</div>;

  const { MapContainer: MC, TileLayer: TL, Marker: MK, useMapEvents: UME } = require('react-leaflet');

  function ClickHandler() {
    UME({
      click: (e: any) => {
        const { lat: la, lng: ln } = e.latlng;
        setPosition([la, ln]);
        onSelect(la, ln);
      },
    });
    return null;
  }

  return (
    <MC center={position} zoom={13} style={{ height: '100%', width: '100%' }} ref={mapRef}>
      <TL attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MK position={position} />
      <ClickHandler />
    </MC>
  );
}

// Small read-only map for venue cards
function MiniMap({ lat, lng }: { lat: number; lng: number }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const L = require('leaflet');
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });
    setReady(true);
  }, []);

  if (!ready) return <div style={{ height: '100%', background: 'var(--glass)' }} />;

  const { MapContainer: MC, TileLayer: TL, Marker: MK } = require('react-leaflet');

  return (
    <MC
      center={[lat, lng]}
      zoom={14}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
      attributionControl={false}
      dragging={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      touchZoom={false}
    >
      <TL url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MK position={[lat, lng]} />
    </MC>
  );
}
