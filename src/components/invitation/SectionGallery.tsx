'use client';
import { Event } from '@/lib/types';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, ChevronLeft, ChevronRight } from 'lucide-react';

// Repeating bento rhythm (col-span/row-span out of a 4-col / 140px-row grid)
// applied by index — gives the grid varied tile sizes instead of a uniform
// checkerboard, without needing real image dimensions.
const BENTO_PATTERN: Array<{ col: number; row: number }> = [
  { col: 2, row: 2 },
  { col: 1, row: 1 },
  { col: 1, row: 2 },
  { col: 2, row: 1 },
  { col: 1, row: 1 },
  { col: 1, row: 1 },
  { col: 2, row: 1 },
  { col: 2, row: 2 },
];

export default function SectionGallery({ event }: { event: Event }) {
  const images = (event.heroMedia || []).filter(m => m.type === 'image').map(m => m.url);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  // The bento rhythm only reads well with enough tiles to fill the pattern —
  // below that, fall back to a plain uniform grid.
  const useBento = images.length >= 4;

  return (
    <section style={{ background: 'var(--t-bg, var(--bg))', padding: '5rem 1.5rem' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <motion.div
          style={{ textAlign: 'center', marginBottom: '3rem' }}
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        >
          <Camera size={32} style={{ color: 'var(--t-accent, var(--gold))', margin: '0 auto 1rem' }} />
          <h2 className="font-display section-heading mb-2">
            Notre <span className="gradient-gold">galerie</span>
          </h2>
        </motion.div>

        {/* Grid */}
        <div className={useBento ? 'gallery-bento-grid' : undefined} style={useBento ? {
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gridAutoRows: '140px',
          gap: '0.75rem',
        } : {
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '0.75rem',
        }}>
          {images.map((url, i) => {
            const bento = BENTO_PATTERN[i % BENTO_PATTERN.length];
            return (
            <motion.button
              key={i}
              className="gallery-photo-frame"
              onClick={() => setLightboxIndex(i)}
              style={{
                position: 'relative', overflow: 'hidden', cursor: 'pointer',
                borderRadius: 'var(--t-radius, 14px)', border: 'none', padding: 0,
                ...(useBento
                  ? { gridColumn: `span ${bento.col}`, gridRow: `span ${bento.row}` }
                  : { aspectRatio: i % 3 === 0 ? '4/5' : '1/1' }),
              }}
              initial={{ opacity: 0, scale: 1.04, clipPath: 'inset(12% round 12px)' }}
              whileInView={{ opacity: 1, scale: 1, clipPath: 'inset(0% round 12px)' }}
              viewport={{ once: true, margin: '-10%' }}
              transition={{ duration: 0.7, delay: (i % 8) * 0.08, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.03 }}
            >
              <img src={url} alt={`Photo ${i + 1}`} style={{
                width: '100%', height: '100%', objectFit: 'cover',
              }} />
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 50%)',
                opacity: 0, transition: 'opacity 0.3s',
              }} className="gallery-overlay" />
            </motion.button>
            );
          })}
        </div>

        {useBento && (
          <style>{`
            @media (max-width: 640px) {
              .gallery-bento-grid { grid-template-columns: repeat(2, 1fr) !important; grid-auto-rows: 110px !important; }
              .gallery-bento-grid .gallery-photo-frame { grid-column: span 1 !important; grid-row: span 1 !important; }
            }
          `}</style>
        )}

        {/* Lightbox */}
        <AnimatePresence>
          {lightboxIndex !== null && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: 'rgba(0,0,0,0.9)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}
              onClick={() => setLightboxIndex(null)}
            >
              <motion.img
                key={lightboxIndex}
                src={images[lightboxIndex]}
                alt=""
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: 8 }}
                onClick={e => e.stopPropagation()}
              />
              <button onClick={() => setLightboxIndex(null)} style={{
                position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%',
                width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#fff',
              }}><X size={20} /></button>
              {images.length > 1 && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + images.length) % images.length); }} style={{
                    position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)',
                    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', cursor: 'pointer', color: '#fff',
                  }}><ChevronLeft size={22} /></button>
                  <button onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % images.length); }} style={{
                    position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)',
                    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', cursor: 'pointer', color: '#fff',
                  }}><ChevronRight size={22} /></button>
                </>
              )}
              <div style={{
                position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
                color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem',
              }}>{lightboxIndex + 1} / {images.length}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
