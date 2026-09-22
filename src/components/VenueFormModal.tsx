'use client';
import { useState, useEffect } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { SearchableMapPicker } from './MapPicker';

const venueEmojiOptions = ['📍','⛪','🕌','🏛️','🏨','🍽️','🎪','🌳','🏖️','🎵','💒','🏠','🎭','🏢'];

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
