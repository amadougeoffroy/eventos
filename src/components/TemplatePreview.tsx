'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays,
  MapPin,
  Clock,
  Sparkles,
  Shirt,
  PartyPopper,
} from 'lucide-react';
import {
  getTemplate,
  getTemplateVariant,
} from '@/lib/templates/template-registry';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProgramItem {
  id: string;
  time: string;
  title: string;
  icon: string;
}

interface TemplatePreviewProps {
  templateId: string;
  eventType: string;
  eventName: string;
  date: string;
  time: string;
  venue: string;
  brideName?: string;
  groomName?: string;
  dressCode?: string;
  welcomeMessage?: string;
  program: ProgramItem[];
  primaryColor: string;
  heroImages?: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format a date string to a readable French date. */
function formatDateFr(raw: string): string {
  if (!raw) return '';
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return raw;
  }
}

/** Blend a custom primary color into the palette when it differs from the template default. */
function blendPalette(
  palette: Record<string, string> & { primary: string; accent: string },
  customPrimary: string,
) {
  const defaultPrimary = palette.primary;
  if (
    customPrimary &&
    customPrimary.toLowerCase() !== defaultPrimary.toLowerCase()
  ) {
    return {
      ...palette,
      primary: customPrimary,
      accent: customPrimary,
    };
  }
  return palette;
}

// ---------------------------------------------------------------------------
// Sub-components (animation wrappers)
// ---------------------------------------------------------------------------

const sectionVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.2 } },
};

function Section({
  children,
  motionKey,
  style,
}: {
  children: React.ReactNode;
  motionKey: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      key={motionKey}
      variants={sectionVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      style={{ transition: 'all 0.3s ease', ...style }}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function TemplatePreview({
  templateId,
  eventType,
  eventName,
  date,
  time,
  venue,
  brideName,
  groomName,
  dressCode,
  welcomeMessage,
  program,
  primaryColor,
  heroImages: heroImagesProp,
}: TemplatePreviewProps) {
  // ---- Resolve template data ------------------------------------------------

  const template = useMemo(() => getTemplate(templateId), [templateId]);
  const variant = useMemo(
    () => getTemplateVariant(templateId, eventType),
    [templateId, eventType],
  );

  const fonts = template?.fonts ?? {
    display: 'Playfair Display',
    body: 'Inter',
    script: 'Great Vibes',
  };

  const palette = useMemo(() => {
    const base = variant?.palette ?? {
      primary: '#D4AF37',
      secondary: '#F7C5CC',
      bg: '#FFFFFF',
      bgWarm: '#FDF8F3',
      text: '#2D2A26',
      textMuted: '#9B9590',
      accent: '#C8A96E',
      heroOverlay: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6))',
    };
    return blendPalette(base as unknown as Record<string, string> & { primary: string; accent: string }, primaryColor);
  }, [variant, primaryColor]);

  const isWedding = eventType === 'wedding';
  const formattedDate = formatDateFr(date);

  // Hero images: custom > default
  const resolvedHeroImages = useMemo(() => {
    if (heroImagesProp && heroImagesProp.length > 0) return heroImagesProp;
    return variant?.defaultHeroImages ?? [];
  }, [heroImagesProp, variant]);

  // Slideshow rotation
  const [slideIndex, setSlideIndex] = useState(0);
  useEffect(() => {
    if (resolvedHeroImages.length <= 1) { setSlideIndex(0); return; }
    const timer = setInterval(() => {
      setSlideIndex(i => (i + 1) % resolvedHeroImages.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [resolvedHeroImages.length]);

  const currentHeroImage = resolvedHeroImages[slideIndex] || resolvedHeroImages[0] || '';

  // ---- Responsive: hide on mobile ------------------------------------------
  // We return null below 768 px. The parent handles toggling.
  // Using a simple CSS media-query approach via a wrapper.

  const visibleProgram = program.slice(0, 4);

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <div
      style={{
        display: 'var(--tp-display, block)',
      }}
      className="template-preview-root"
    >
      {/* Responsive hide style */}
      <style>{`
        @media (max-width: 767px) {
          .template-preview-root {
            display: none !important;
          }
        }
        .tp-scroll::-webkit-scrollbar {
          display: none;
        }
        .tp-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* ── Phone Frame ─────────────────────────────────────────────── */}
      <div
        style={{
          width: 280,
          height: 560,
          borderRadius: 32,
          border: '3px solid var(--border-light, #e5e5e5)',
          background: palette.bg,
          boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          fontFamily: `"${fonts.body}", sans-serif`,
          transition: 'all 0.3s ease',
        }}
      >
        {/* ── Status bar ──────────────────────────────────────────── */}
        <div
          style={{
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            fontSize: '0.6rem',
            fontWeight: 600,
            color: palette.textMuted,
            background: palette.bg,
            flexShrink: 0,
            letterSpacing: '0.02em',
          }}
        >
          <span>9:41</span>
          <span style={{ letterSpacing: 2 }}>── ─ ▐█</span>
        </div>

        {/* ── Scrollable content ──────────────────────────────────── */}
        <div
          className="tp-scroll"
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          <AnimatePresence>
            {/* ── A. Hero Section ─────────────────────────────────── */}
            <Section key={`hero-${templateId}-${eventType}`} motionKey={`hero-${templateId}-${eventType}`}>
              <div
                style={{
                  height: 220,
                  backgroundImage: currentHeroImage
                    ? `url(${currentHeroImage})`
                    : `linear-gradient(135deg, ${palette.primary}, ${palette.accent})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px 16px',
                  textAlign: 'center',
                  transition: 'background-image 0.6s ease',
                }}
              >
                {/* Overlay */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.35)',
                    zIndex: 0,
                  }}
                />

                {/* Content */}
                <div style={{ position: 'relative', zIndex: 1 }}>
                  {isWedding ? (
                    <motion.p
                      key={`names-${brideName}-${groomName}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.35 }}
                      style={{
                        fontFamily: `"${fonts.script}", cursive`,
                        fontSize: '1.25rem',
                        color: '#FFFFFF',
                        margin: 0,
                        lineHeight: 1.3,
                        textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      }}
                    >
                      {brideName || 'Prénom'}{' '}
                      <span
                        style={{
                          fontSize: '0.85rem',
                          opacity: 0.85,
                          fontFamily: `"${fonts.body}", sans-serif`,
                        }}
                      >
                        &amp;
                      </span>{' '}
                      {groomName || 'Prénom'}
                    </motion.p>
                  ) : (
                    <motion.p
                      key={`ename-${eventName}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.35 }}
                      style={{
                        fontFamily: `"${fonts.display}", serif`,
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: '#FFFFFF',
                        margin: 0,
                        lineHeight: 1.3,
                        textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      }}
                    >
                      {eventName || "Nom de l'événement"}
                    </motion.p>
                  )}

                  {/* Date */}
                  {formattedDate && (
                    <motion.p
                      key={`date-${date}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1, duration: 0.3 }}
                      style={{
                        fontSize: '0.55rem',
                        color: 'rgba(255,255,255,0.85)',
                        margin: '8px 0 0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                      }}
                    >
                      <CalendarDays size={10} />
                      {formattedDate}
                    </motion.p>
                  )}

                  {/* Time */}
                  {time && (
                    <p
                      style={{
                        fontSize: '0.5rem',
                        color: 'rgba(255,255,255,0.7)',
                        margin: '3px 0 0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 3,
                      }}
                    >
                      <Clock size={8} />
                      {time}
                    </p>
                  )}

                  {/* Venue */}
                  {venue && (
                    <p
                      style={{
                        fontSize: '0.5rem',
                        color: 'rgba(255,255,255,0.7)',
                        margin: '3px 0 0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 3,
                      }}
                    >
                      <MapPin size={8} />
                      {venue}
                    </p>
                  )}
                </div>
              </div>
            </Section>

            {/* ── B. Welcome Section ──────────────────────────────── */}
            <Section key={`welcome-${welcomeMessage?.slice(0, 20) || 'empty'}`} motionKey={`welcome-${welcomeMessage?.slice(0, 20) || 'empty'}`}>
              <div
                style={{
                  padding: '14px 16px 10px',
                  background: palette.bgWarm,
                  transition: 'background 0.3s ease',
                }}
              >
                <p
                  style={{
                    fontSize: '0.55rem',
                    lineHeight: 1.55,
                    color: welcomeMessage ? palette.text : palette.textMuted,
                    fontStyle: welcomeMessage ? 'normal' : 'italic',
                    margin: 0,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: 'vertical',
                    fontFamily: `"${fonts.body}", sans-serif`,
                    transition: 'color 0.3s ease',
                  }}
                >
                  {welcomeMessage || 'Votre message de bienvenue...'}
                </p>
              </div>
            </Section>

            {/* ── C. Program Section ──────────────────────────────── */}
            <Section key={`program-${program.length}`} motionKey={`program-${program.length}`}>
              <div
                style={{
                  padding: '10px 16px 10px',
                  background: palette.bg,
                  transition: 'background 0.3s ease',
                }}
              >
                {/* Title */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    marginBottom: 8,
                  }}
                >
                  <PartyPopper
                    size={10}
                    style={{ color: palette.accent, flexShrink: 0 }}
                  />
                  <span
                    style={{
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      fontFamily: `"${fonts.display}", serif`,
                      color: palette.text,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Programme
                  </span>
                </div>

                {visibleProgram.length > 0 ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 5,
                    }}
                  >
                    {visibleProgram.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25 }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: '0.5rem',
                          color: palette.text,
                        }}
                      >
                        <span style={{ fontSize: '0.6rem', flexShrink: 0 }}>
                          {item.icon || '•'}
                        </span>
                        <span
                          style={{
                            color: palette.accent,
                            fontWeight: 600,
                            minWidth: 28,
                            fontFamily: `"${fonts.body}", sans-serif`,
                          }}
                        >
                          {item.time}
                        </span>
                        <span
                          style={{
                            fontFamily: `"${fonts.body}", sans-serif`,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.title}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p
                    style={{
                      fontSize: '0.5rem',
                      color: palette.textMuted,
                      fontStyle: 'italic',
                      margin: 0,
                      fontFamily: `"${fonts.body}", sans-serif`,
                    }}
                  >
                    Ajoutez des éléments au programme
                  </p>
                )}
              </div>
            </Section>

            {/* ── D. Dress Code Badge ─────────────────────────────── */}
            {dressCode && (
              <Section key={`dress-${dressCode}`} motionKey={`dress-${dressCode}`}>
                <div
                  style={{
                    padding: '6px 16px 8px',
                    display: 'flex',
                    justifyContent: 'center',
                    background: palette.bg,
                  }}
                >
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '3px 10px',
                      borderRadius: 20,
                      background: `${palette.accent}18`,
                      border: `1px solid ${palette.accent}30`,
                      fontSize: '0.48rem',
                      color: palette.accent,
                      fontWeight: 600,
                      fontFamily: `"${fonts.body}", sans-serif`,
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <Shirt size={8} />
                    {dressCode}
                  </div>
                </div>
              </Section>
            )}

            {/* ── E. RSVP Button ──────────────────────────────────── */}
            <Section key="rsvp-btn" motionKey="rsvp-btn">
              <div
                style={{
                  padding: '10px 24px 18px',
                  display: 'flex',
                  justifyContent: 'center',
                  background: palette.bg,
                }}
              >
                <div
                  style={{
                    width: '100%',
                    padding: '8px 0',
                    borderRadius: 24,
                    background: `linear-gradient(135deg, ${palette.accent}, ${palette.primary})`,
                    textAlign: 'center',
                    fontSize: '0.55rem',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    fontFamily: `"${fonts.display}", serif`,
                    letterSpacing: '0.04em',
                    textShadow: '0 1px 4px rgba(0,0,0,0.2)',
                    cursor: 'default',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                  }}
                >
                  <Sparkles size={10} />
                  Confirmer ma présence
                </div>
              </div>
            </Section>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
