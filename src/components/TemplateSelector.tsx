'use client';

import { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import {
  getTemplatesForPlan,
  getTemplateVariant,
  type TemplateDesign,
  type HeroType,
} from '@/lib/templates/template-registry';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TemplateSelectorProps {
  plan: 'essentiel' | 'pro' | 'premium';
  eventType: string;
  selectedTemplateId: string;
  onSelect: (templateId: string) => void;
}

// ---------------------------------------------------------------------------
// Label maps
// ---------------------------------------------------------------------------

const HERO_TYPE_LABELS: Record<HeroType, string> = {
  image: '🖼️ Image fixe',
  slideshow: '🌅 Diaporama',
  video: '🎬 Vidéo',
};

const EFFECT_LABELS: Record<string, string> = {
  filmGrain: '🎬 Film',
  polaroid: '📷 Polaroid',
  ornaments: '🌿 Ornements',
};

const PLAN_LABELS: Record<string, string> = {
  essentiel: 'Essentiel',
  pro: 'Pro',
  premium: 'Premium',
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PlanBadge({ plan }: { plan: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    essentiel: { bg: 'rgba(255,255,255,0.2)', text: '#fff' },
    pro: { bg: 'rgba(59,130,246,0.85)', text: '#fff' },
    premium: { bg: 'rgba(212,175,55,0.9)', text: '#1a1a1a' },
  };
  const c = colors[plan] ?? colors.essentiel;

  return (
    <span
      style={{
        position: 'absolute',
        top: 8,
        left: 8,
        fontSize: '0.6rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        padding: '0.2rem 0.5rem',
        borderRadius: '0.4rem',
        background: c.bg,
        color: c.text,
        backdropFilter: 'blur(6px)',
      }}
    >
      {PLAN_LABELS[plan] ?? plan}
    </span>
  );
}

function LayoutBadge({ layout }: { layout: string }) {
  return (
    <span
      style={{
        position: 'absolute',
        top: 8,
        right: 8,
        fontSize: '0.55rem',
        fontWeight: 600,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        padding: '0.15rem 0.45rem',
        borderRadius: '0.35rem',
        background: 'rgba(0,0,0,0.35)',
        color: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(4px)',
      }}
    >
      {layout}
    </span>
  );
}

// ---------------------------------------------------------------------------
// TemplateCard
// ---------------------------------------------------------------------------

interface TemplateCardProps {
  template: TemplateDesign;
  eventType: string;
  isSelected: boolean;
  onSelect: () => void;
}

function TemplateCard({ template, eventType, isSelected, onSelect }: TemplateCardProps) {
  const variant = getTemplateVariant(template.id, eventType);
  if (!variant) return null;

  const activeEffects = Object.entries(template.specialEffects)
    .filter(([, v]) => v)
    .map(([k]) => k);

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      style={{
        cursor: 'pointer',
        border: isSelected
          ? '2px solid var(--gold, #D4AF37)'
          : '1px solid var(--border-light, rgba(255,255,255,0.08))',
        borderRadius: '1rem',
        overflow: 'hidden',
        background: 'transparent',
        padding: 0,
        textAlign: 'left',
        width: '100%',
        boxShadow: isSelected
          ? '0 0 20px rgba(212,175,55,0.35), 0 0 60px rgba(212,175,55,0.10)'
          : '0 2px 12px rgba(0,0,0,0.12)',
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
        outline: 'none',
      }}
    >
      {/* ------ Preview area ------ */}
      <div
        style={{
          height: 180,
          borderRadius: '1rem 1rem 0 0',
          background: `linear-gradient(135deg, ${variant.palette.primary}, ${variant.palette.accent})`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${variant.palette.secondary}33 0%, transparent 70%)`,
            top: -60,
            right: -40,
            pointerEvents: 'none',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            width: 140,
            height: 140,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${variant.palette.secondary}22 0%, transparent 70%)`,
            bottom: -30,
            left: -20,
            pointerEvents: 'none',
          }}
        />

        {/* Font preview */}
        <span
          style={{
            fontFamily: template.fonts.script,
            fontSize: '2rem',
            color: '#fff',
            textShadow: '0 2px 10px rgba(0,0,0,0.3)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          Invitation
        </span>
        <span
          style={{
            fontFamily: template.fonts.display,
            fontSize: '0.75rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.7)',
            marginTop: '0.5rem',
            position: 'relative',
            zIndex: 1,
          }}
        >
          Aperçu du template
        </span>

        {/* Badges */}
        <LayoutBadge layout={template.layout} />
        <PlanBadge plan={template.plan} />
      </div>

      {/* ------ Info area ------ */}
      <div
        style={{
          padding: '1rem',
          background: 'var(--bg-card, #1a1a2e)',
          borderRadius: '0 0 1rem 1rem',
        }}
      >
        {/* Title + check */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h4
            style={{
              margin: 0,
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--text-primary, #f0f0f0)',
            }}
          >
            {template.name}
          </h4>

          <AnimatePresence>
            {isSelected && (
              <motion.span
                key="check"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                <CheckCircle2
                  size={20}
                  style={{ color: 'var(--gold, #D4AF37)' }}
                />
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Selected badge text */}
        <AnimatePresence>
          {isSelected && (
            <motion.span
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                display: 'inline-block',
                marginTop: '0.35rem',
                fontSize: '0.65rem',
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: 'var(--gold, #D4AF37)',
              }}
            >
              Sélectionné
            </motion.span>
          )}
        </AnimatePresence>

        {/* Description */}
        <p
          style={{
            margin: '0.5rem 0 0',
            fontSize: '0.8rem',
            lineHeight: 1.5,
            color: 'var(--text-muted, #9b9590)',
          }}
        >
          {template.description}
        </p>

        {/* Hero types */}
        <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
          {template.heroTypes.map((ht) => (
            <span
              key={ht}
              style={{
                fontSize: '0.6rem',
                padding: '0.15rem 0.4rem',
                borderRadius: '0.3rem',
                background: 'var(--border-light, rgba(255,255,255,0.08))',
                color: 'var(--text-muted, #9b9590)',
                whiteSpace: 'nowrap',
              }}
            >
              {HERO_TYPE_LABELS[ht]}
            </span>
          ))}
        </div>

        {/* Special effects */}
        {activeEffects.length > 0 && (
          <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
            {activeEffects.map((fx) => (
              <span
                key={fx}
                style={{
                  fontSize: '0.6rem',
                  padding: '0.15rem 0.4rem',
                  borderRadius: '0.3rem',
                  background: 'rgba(212,175,55,0.12)',
                  color: 'var(--gold, #D4AF37)',
                  whiteSpace: 'nowrap',
                }}
              >
                {EFFECT_LABELS[fx] ?? fx}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function TemplateSelector({
  plan,
  eventType,
  selectedTemplateId,
  onSelect,
}: TemplateSelectorProps) {
  const templates = useMemo(
    () => getTemplatesForPlan(plan, eventType),
    [plan, eventType],
  );

  // Auto-select the single template for "essentiel"
  useEffect(() => {
    if (plan === 'essentiel' && templates.length === 1) {
      const only = templates[0];
      if (selectedTemplateId !== only.id) {
        onSelect(only.id);
      }
    }
  }, [plan, templates, selectedTemplateId, onSelect]);

  if (templates.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '2rem',
          color: 'var(--text-muted, #9b9590)',
          fontSize: '0.9rem',
        }}
      >
        Aucun template disponible pour ce type d'événement.
      </div>
    );
  }

  // ---- Essentiel: single imposed template ----
  if (plan === 'essentiel' && templates.length === 1) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        {/* Info message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            padding: '0.75rem 1.25rem',
            borderRadius: '0.75rem',
            background: 'rgba(212,175,55,0.08)',
            border: '1px solid rgba(212,175,55,0.25)',
            color: 'var(--gold, #D4AF37)',
            fontSize: '0.85rem',
            fontWeight: 500,
            textAlign: 'center',
            maxWidth: 440,
          }}
        >
          Ce template est automatiquement sélectionné pour votre formule Essentiel
        </motion.div>

        {/* Centered card with gold frame */}
        <div style={{ maxWidth: 340, width: '100%' }}>
          <TemplateCard
            template={templates[0]}
            eventType={eventType}
            isSelected
            onSelect={() => onSelect(templates[0].id)}
          />
        </div>
      </div>
    );
  }

  // ---- Pro / Premium: selectable grid ----
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1rem',
      }}
    >
      <AnimatePresence mode="popLayout">
        {templates.map((t) => (
          <TemplateCard
            key={t.id}
            template={t}
            eventType={eventType}
            isSelected={selectedTemplateId === t.id}
            onSelect={() => onSelect(t.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
