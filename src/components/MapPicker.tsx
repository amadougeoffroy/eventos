'use client';
import { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { useThemeLanguage } from '@/context/ThemeLanguageContext';

// Searchable map picker with geocoding — shared by the venues page and the
// event-creation wizard's venue modal, so there is a single Leaflet/Nominatim
// integration to maintain instead of two near-identical copies.
export function SearchableMapPicker({ lat, lng, mapReady, onSelect }: {
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

function ensureLeafletDefaultIcon() {
  const L = require('leaflet');
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
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
    ensureLeafletDefaultIcon();
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
export function MiniMap({ lat, lng }: { lat: number; lng: number }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    ensureLeafletDefaultIcon();
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
