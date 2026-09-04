'use client';
import { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader2, Navigation } from 'lucide-react';

const venueEmojiOptions = ['📍','⛪','🕌','🏛️','🏨','🍽️','🎪','🌳','🏖️','🎵','💒','🏠','🎭','🏢'];

// Searchable map picker with geocoding
export function SearchableMapPicker({ lat, lng, mapReady, onSelect }: {
  lat: number; lng: number; mapReady: boolean;
  onSelect: (lat: number, lng: number, address?: string) => void;
}) {
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
            placeholder="Rechercher un lieu (ex: Cathédrale Abidjan)..."
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
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--glass)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Chargement...</div>
        )}
      </div>
    </div>
  );
}

// Leaflet map picker component (client-only)
function MapPickerInner({ lat, lng, onSelect }: { lat: number; lng: number; onSelect: (lat: number, lng: number) => void }) {
  const [position, setPosition] = useState<[number, number]>([lat, lng]);
  const [leafletReady, setLeafletReady] = useState(false);
  const mapRef = useRef<any>(null);

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

  if (!leafletReady) return <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--glass)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Chargement de la carte...</div>;

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

// Venue form modal — used in both venues page and event creation
export interface VenueFormData {
  name: string;
  address: string;
  emoji: string;
  lat: number;
  lng: number;
}

export function VenueFormModal({
  onSave,
  onClose,
  title = 'Ajouter un lieu',
}: {
  onSave: (data: VenueFormData) => void;
  onClose: () => void;
  title?: string;
}) {
  const [form, setForm] = useState<VenueFormData>({
    name: '', address: '', emoji: '📍', lat: 5.316, lng: -4.016,
  });
  const [mapReady, setMapReady] = useState(false);
  const [mapKey, setMapKey] = useState(0);

  useEffect(() => {
    import('leaflet/dist/leaflet.css');
    setMapReady(true);
  }, []);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)', borderRadius: '1.25rem',
          padding: '1.75rem', width: '100%', maxWidth: 480,
          border: '1px solid var(--border-light)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
          maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 className="font-display" style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
            <MapPin size={18} style={{ display: 'inline', marginRight: '0.4rem', color: 'var(--gold)' }} />
            {title}
          </h3>
          <button onClick={onClose} style={{
            background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 8,
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.1rem',
          }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* Name */}
          <div>
            <label className="label">Nom du lieu *</label>
            <input className="input" placeholder="Église Saint-Paul" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))} autoFocus />
          </div>
          {/* Address */}
          <div>
            <label className="label">Adresse *</label>
            <input className="input" placeholder="Boulevard de la Paix, Abidjan" value={form.address}
              onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
          </div>
          {/* Emoji picker */}
          <div>
            <label className="label">Icône</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
              {venueEmojiOptions.map(em => (
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
              Position sur la carte *
            </label>
            <SearchableMapPicker
              key={mapKey}
              lat={form.lat}
              lng={form.lng}
              mapReady={mapReady}
              onSelect={(lat, lng, address) => {
                setForm(p => ({
                  ...p,
                  lat,
                  lng,
                  address: address || p.address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
                }));
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.4rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              <Navigation size={10} />
              Coordonnées : {form.lat.toFixed(5)}, {form.lng.toFixed(5)}
            </div>
          </div>
          {/* Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button onClick={onClose} className="btn-secondary" style={{ flex: 1, padding: '0.65rem' }}>
              Annuler
            </button>
            <button
              onClick={() => {
                if (form.name) {
                  const finalForm = {
                    ...form,
                    address: form.address || `${form.lat.toFixed(5)}, ${form.lng.toFixed(5)}`,
                  };
                  onSave(finalForm);
                }
              }}
              disabled={!form.name}
              className="btn-primary"
              style={{
                flex: 1, padding: '0.65rem',
                opacity: !form.name ? 0.5 : 1,
                cursor: !form.name ? 'not-allowed' : 'pointer',
              }}
            >Ajouter</button>
          </div>
        </div>
      </div>
    </div>
  );
}
