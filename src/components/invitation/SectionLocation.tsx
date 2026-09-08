'use client';
import { Event, Venue } from '@/lib/types';
import { motion } from 'framer-motion';
import { Navigation } from 'lucide-react';

interface ItineraryStop {
  id: string;
  time: string;
  title: string;
  icon: string;
  venue: { name: string; address: string; lat?: number; lng?: number; emoji?: string };
}

export default function SectionLocation({ event, itineraryStops }: { event: Event; itineraryStops: ItineraryStop[] }) {
  return (
    <section style={{ background: 'var(--t-bg-warm, var(--bg-section))', padding: '5rem 1.5rem' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <motion.div
          style={{ textAlign: 'center', marginBottom: '2rem' }}
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        >
          <h2 className="font-display text-3xl font-bold mb-2">
            Comment <span className="gradient-gold">nous rejoindre</span>
          </h2>
          <p className="text-sm" style={{ color: 'var(--t-text-muted, var(--text-muted))' }}>
            {itineraryStops.length > 1
              ? "Suivez l'itinéraire entre les différents lieux de la journée"
              : "Retrouvez-nous à l'adresse ci-dessous"}
          </p>
        </motion.div>

        <motion.div
          className="card"
          style={{ padding: 0, overflow: 'hidden' }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div style={{ width: '100%', height: 320, position: 'relative' }}>
            {itineraryStops.length > 1 ? (
              <iframe
                title="Itinéraire"
                width="100%" height="100%" style={{ border: 0 }} loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps/embed/v1/directions?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&origin=${itineraryStops[0].venue.lat || 0},${itineraryStops[0].venue.lng || 0}&destination=${itineraryStops[itineraryStops.length - 1].venue.lat || 0},${itineraryStops[itineraryStops.length - 1].venue.lng || 0}${itineraryStops.length > 2 ? '&waypoints=' + itineraryStops.slice(1, -1).map(s => `${s.venue.lat || 0},${s.venue.lng || 0}`).join('|') : ''}&mode=driving`}
              />
            ) : (
              <iframe
                title="Lieu de l'événement"
                width="100%" height="100%" style={{ border: 0 }} loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(event.venue + ', ' + (event.venueAddress || ''))}&zoom=15`}
              />
            )}
          </div>

          <div style={{ padding: '1rem 1.5rem' }}>
            <a
              href={itineraryStops.length > 1
                ? `https://www.google.com/maps/dir/${itineraryStops.map(s => `${s.venue.lat || 0},${s.venue.lng || 0}`).join('/')}`
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue + ', ' + (event.venueAddress || ''))}`
              }
              target="_blank" rel="noopener noreferrer" className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none', width: '100%' }}
            >
              <Navigation size={16} />
              {itineraryStops.length > 1 ? "Voir l'itinéraire complet" : 'Ouvrir dans Google Maps'}
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
