// =============================================================================
// Template Registry — Eventos Invitation Platform
// =============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HeroType = 'image' | 'slideshow' | 'video';
export type ParticleType = 'petals' | 'balloons' | 'doves' | 'stars' | 'hearts' | 'confetti';
export type LayoutStyle = 'classic' | 'modern' | 'editorial';

export interface TemplatePalette {
  primary: string;
  secondary: string;
  bg: string;
  bgWarm: string;
  text: string;
  textMuted: string;
  accent: string;
  heroOverlay: string;
}

export interface TemplateVariant {
  palette: TemplatePalette;
  defaultHeroImages: string[];
  particles: ParticleType;
}

export interface TemplateDesign {
  id: string;
  name: string;
  description: string;
  plan: 'essentiel' | 'pro' | 'premium';
  fonts: { display: string; body: string; script: string };
  heroTypes: HeroType[];
  layout: LayoutStyle;
  animations: {
    entrance: 'fadeUp' | 'slideIn' | 'scaleIn' | 'none';
    transition: 'fade' | 'slide' | 'zoom' | 'none';
    parallax: boolean;
  };
  specialEffects: {
    filmGrain?: boolean;
    polaroid?: boolean;
    glitch?: boolean;
    ornaments?: boolean;
  };
  sections: string[];
  variants: Record<string, TemplateVariant>;
}

// ---------------------------------------------------------------------------
// Shared constants
// ---------------------------------------------------------------------------

const HERO_OVERLAY_LIGHT =
  'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6))';

const HERO_OVERLAY_DARK =
  'linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.7))';

const SECTIONS_ESSENTIEL: string[] = [
  'hero',
  'countdown',
  'welcome',
  'program',
  'dressCode',
  'location',
  'rsvp',
  'sweetMessage',
];

const SECTIONS_PREMIUM: string[] = [
  'hero',
  'countdown',
  'welcome',
  'ourStory',
  'program',
  'dressCode',
  'location',
  'gallery',
  'rsvp',
  'giftList',
  'sweetMessage',
];

/** Helper — generate N default hero image paths for a given type & template. */
function heroImages(type: string, template: string, count: number): string[] {
  if (count === 1) {
    return [`/templates/defaults/${type}/${template}-1.png`];
  }
  return Array.from({ length: count }, (_, i) =>
    `/templates/defaults/${type}/${template}-${i + 1}.png`,
  );
}

// ---------------------------------------------------------------------------
// Particles per event type (shared across most designs)
// ---------------------------------------------------------------------------

const PARTICLES_BY_TYPE: Record<string, ParticleType> = {
  wedding: 'petals',
  birthday: 'balloons',
  baptism: 'doves',
  party: 'stars',
  babyshower: 'hearts',
  corporate: 'confetti',
  custom: 'confetti',
};

// ---------------------------------------------------------------------------
// 1 · Classique — Essentiel (imposé)
// ---------------------------------------------------------------------------

const classique: TemplateDesign = {
  id: 'classique',
  name: 'Classique',
  description:
    'Un design intemporel et élégant, parfait pour toutes les occasions. Inclus dans le plan Essentiel.',
  plan: 'pro',
  fonts: { display: 'Playfair Display', body: 'Inter', script: 'Great Vibes' },
  heroTypes: ['image', 'slideshow'],
  layout: 'classic',
  animations: { entrance: 'fadeUp', transition: 'fade', parallax: false },
  specialEffects: {},
  sections: [...SECTIONS_ESSENTIEL],
  variants: {
    wedding: {
      palette: {
        primary: '#D4AF37',
        secondary: '#F7C5CC',
        bg: '#FFFFFF',
        bgWarm: '#FDF8F3',
        text: '#2D2A26',
        textMuted: '#9B9590',
        accent: '#C8A96E',
        heroOverlay: HERO_OVERLAY_LIGHT,
      },
      defaultHeroImages: heroImages('wedding', 'classique', 1),
      particles: 'petals',
    },
    birthday: {
      palette: {
        primary: '#FF6B6B',
        secondary: '#FFD93D',
        bg: '#FFFFFF',
        bgWarm: '#FFF8F0',
        text: '#2D2A26',
        textMuted: '#9B9590',
        accent: '#FF6B6B',
        heroOverlay: HERO_OVERLAY_LIGHT,
      },
      defaultHeroImages: heroImages('birthday', 'classique', 1),
      particles: 'balloons',
    },
    baptism: {
      palette: {
        primary: '#87CEEB',
        secondary: '#B0E0E6',
        bg: '#FFFFFF',
        bgWarm: '#F0F8FF',
        text: '#2D2A26',
        textMuted: '#9B9590',
        accent: '#87CEEB',
        heroOverlay: HERO_OVERLAY_LIGHT,
      },
      defaultHeroImages: heroImages('baptism', 'classique', 1),
      particles: 'doves',
    },
    party: {
      palette: {
        primary: '#C0C0C0',
        secondary: '#E8E8E8',
        bg: '#1A1A2E',
        bgWarm: '#16213E',
        text: '#FFFFFF',
        textMuted: '#A0A0B0',
        accent: '#C0C0C0',
        heroOverlay: HERO_OVERLAY_DARK,
      },
      defaultHeroImages: heroImages('party', 'classique', 1),
      particles: 'stars',
    },
    babyshower: {
      palette: {
        primary: '#FFB6C1',
        secondary: '#98D8C8',
        bg: '#FFFFFF',
        bgWarm: '#FFF0F5',
        text: '#2D2A26',
        textMuted: '#9B9590',
        accent: '#FFB6C1',
        heroOverlay: HERO_OVERLAY_LIGHT,
      },
      defaultHeroImages: heroImages('babyshower', 'classique', 1),
      particles: 'hearts',
    },
    corporate: {
      palette: {
        primary: '#4169E1',
        secondary: '#6C757D',
        bg: '#FFFFFF',
        bgWarm: '#F8F9FA',
        text: '#2D2A26',
        textMuted: '#6C757D',
        accent: '#4169E1',
        heroOverlay: HERO_OVERLAY_LIGHT,
      },
      defaultHeroImages: heroImages('corporate', 'classique', 1),
      particles: 'confetti',
    },
    custom: {
      palette: {
        primary: '#9B59B6',
        secondary: '#D4AF37',
        bg: '#FFFFFF',
        bgWarm: '#F9F5FF',
        text: '#2D2A26',
        textMuted: '#9B9590',
        accent: '#9B59B6',
        heroOverlay: HERO_OVERLAY_LIGHT,
      },
      defaultHeroImages: heroImages('custom', 'classique', 1),
      particles: 'confetti',
    },
  },
};

// ---------------------------------------------------------------------------
// 2 · Romance — Pro
// ---------------------------------------------------------------------------

const romance: TemplateDesign = {
  id: 'romance',
  name: 'Romance',
  description:
    'Doux et romantique, avec des teintes rosées et une typographie raffinée. Idéal pour les célébrations intimes.',
  plan: 'essentiel',
  fonts: { display: 'Cormorant Garamond', body: 'Lato', script: 'Dancing Script' },
  heroTypes: ['image'],
  layout: 'classic',
  animations: { entrance: 'fadeUp', transition: 'fade', parallax: false },
  specialEffects: {},
  sections: [...SECTIONS_ESSENTIEL],
  variants: {
    wedding: {
      palette: {
        primary: '#B76E79',
        secondary: '#F5E6E8',
        bg: '#FFF9FA',
        bgWarm: '#FFF0F2',
        text: '#2D2A26',
        textMuted: '#9B9590',
        accent: '#B76E79',
        heroOverlay: HERO_OVERLAY_LIGHT,
      },
      defaultHeroImages: heroImages('wedding', 'romance', 3),
      particles: 'petals',
    },
    birthday: {
      palette: {
        primary: '#E91E63',
        secondary: '#FCE4EC',
        bg: '#FFFFFF',
        bgWarm: '#FFF0F5',
        text: '#2D2A26',
        textMuted: '#9B9590',
        accent: '#E91E63',
        heroOverlay: HERO_OVERLAY_LIGHT,
      },
      defaultHeroImages: heroImages('birthday', 'romance', 3),
      particles: 'balloons',
    },
    baptism: {
      palette: {
        primary: '#80DEEA',
        secondary: '#E0F7FA',
        bg: '#FFFFFF',
        bgWarm: '#F0FDFF',
        text: '#2D2A26',
        textMuted: '#9B9590',
        accent: '#80DEEA',
        heroOverlay: HERO_OVERLAY_LIGHT,
      },
      defaultHeroImages: heroImages('baptism', 'romance', 3),
      particles: 'doves',
    },
    party: {
      palette: {
        primary: '#CE93D8',
        secondary: '#F3E5F5',
        bg: '#FFFFFF',
        bgWarm: '#FDF5FF',
        text: '#2D2A26',
        textMuted: '#9B9590',
        accent: '#CE93D8',
        heroOverlay: HERO_OVERLAY_LIGHT,
      },
      defaultHeroImages: heroImages('party', 'romance', 3),
      particles: 'stars',
    },
    babyshower: {
      palette: {
        primary: '#F48FB1',
        secondary: '#FFF0F5',
        bg: '#FFFFFF',
        bgWarm: '#FFF5F8',
        text: '#2D2A26',
        textMuted: '#9B9590',
        accent: '#F48FB1',
        heroOverlay: HERO_OVERLAY_LIGHT,
      },
      defaultHeroImages: heroImages('babyshower', 'romance', 3),
      particles: 'hearts',
    },
    corporate: {
      palette: {
        primary: '#5C6BC0',
        secondary: '#E8EAF6',
        bg: '#FFFFFF',
        bgWarm: '#F5F6FC',
        text: '#2D2A26',
        textMuted: '#6C757D',
        accent: '#5C6BC0',
        heroOverlay: HERO_OVERLAY_LIGHT,
      },
      defaultHeroImages: heroImages('corporate', 'romance', 3),
      particles: 'confetti',
    },
    custom: {
      palette: {
        primary: '#AB47BC',
        secondary: '#F3E5F5',
        bg: '#FFFFFF',
        bgWarm: '#FBF5FD',
        text: '#2D2A26',
        textMuted: '#9B9590',
        accent: '#AB47BC',
        heroOverlay: HERO_OVERLAY_LIGHT,
      },
      defaultHeroImages: heroImages('custom', 'romance', 3),
      particles: 'confetti',
    },
  },
};

// ---------------------------------------------------------------------------
// 3 · Moderne — Pro
// ---------------------------------------------------------------------------

const moderne: TemplateDesign = {
  id: 'moderne',
  name: 'Moderne',
  description:
    'Lignes épurées et design minimaliste. Un look contemporain et sophistiqué pour vos événements.',
  plan: 'pro',
  fonts: { display: 'Outfit', body: 'Inter', script: 'Playfair Display' },
  heroTypes: ['image', 'slideshow'],
  layout: 'modern',
  animations: { entrance: 'slideIn', transition: 'slide', parallax: false },
  specialEffects: {},
  sections: [...SECTIONS_ESSENTIEL],
  variants: {
    wedding: {
      palette: {
        primary: '#1A1A1A',
        secondary: '#F5F5F5',
        bg: '#FFFFFF',
        bgWarm: '#FAFAFA',
        text: '#1A1A1A',
        textMuted: '#757575',
        accent: '#D4AF37',
        heroOverlay: HERO_OVERLAY_DARK,
      },
      defaultHeroImages: heroImages('wedding', 'moderne', 3),
      particles: 'petals',
    },
    birthday: {
      palette: {
        primary: '#1A1A1A',
        secondary: '#F5F5F5',
        bg: '#FFFFFF',
        bgWarm: '#FAFAFA',
        text: '#1A1A1A',
        textMuted: '#757575',
        accent: '#FF6B6B',
        heroOverlay: HERO_OVERLAY_DARK,
      },
      defaultHeroImages: heroImages('birthday', 'moderne', 3),
      particles: 'balloons',
    },
    baptism: {
      palette: {
        primary: '#1A1A1A',
        secondary: '#F5F5F5',
        bg: '#FFFFFF',
        bgWarm: '#FAFAFA',
        text: '#1A1A1A',
        textMuted: '#757575',
        accent: '#4FC3F7',
        heroOverlay: HERO_OVERLAY_DARK,
      },
      defaultHeroImages: heroImages('baptism', 'moderne', 3),
      particles: 'doves',
    },
    party: {
      palette: {
        primary: '#1A1A1A',
        secondary: '#F5F5F5',
        bg: '#0D0D0D',
        bgWarm: '#1A1A1A',
        text: '#F0F0F0',
        textMuted: '#A0A0A0',
        accent: '#E040FB',
        heroOverlay: HERO_OVERLAY_DARK,
      },
      defaultHeroImages: heroImages('party', 'moderne', 3),
      particles: 'stars',
    },
    babyshower: {
      palette: {
        primary: '#1A1A1A',
        secondary: '#F5F5F5',
        bg: '#FFFFFF',
        bgWarm: '#FAFAFA',
        text: '#1A1A1A',
        textMuted: '#757575',
        accent: '#F48FB1',
        heroOverlay: HERO_OVERLAY_DARK,
      },
      defaultHeroImages: heroImages('babyshower', 'moderne', 3),
      particles: 'hearts',
    },
    corporate: {
      palette: {
        primary: '#1A1A1A',
        secondary: '#F5F5F5',
        bg: '#FFFFFF',
        bgWarm: '#FAFAFA',
        text: '#1A1A1A',
        textMuted: '#757575',
        accent: '#2196F3',
        heroOverlay: HERO_OVERLAY_DARK,
      },
      defaultHeroImages: heroImages('corporate', 'moderne', 3),
      particles: 'confetti',
    },
    custom: {
      palette: {
        primary: '#1A1A1A',
        secondary: '#F5F5F5',
        bg: '#FFFFFF',
        bgWarm: '#FAFAFA',
        text: '#1A1A1A',
        textMuted: '#757575',
        accent: '#9C27B0',
        heroOverlay: HERO_OVERLAY_DARK,
      },
      defaultHeroImages: heroImages('custom', 'moderne', 3),
      particles: 'confetti',
    },
  },
};

// ---------------------------------------------------------------------------
// 4 · Royal — Premium
// ---------------------------------------------------------------------------

const royal: TemplateDesign = {
  id: 'royal',
  name: 'Royal',
  description:
    'Luxueux et majestueux, inspiré des grandes cérémonies. Ornements dorés et typographie noble.',
  plan: 'premium',
  fonts: { display: 'Cinzel', body: 'EB Garamond', script: 'Great Vibes' },
  heroTypes: ['image', 'slideshow', 'video'],
  layout: 'editorial',
  animations: { entrance: 'scaleIn', transition: 'zoom', parallax: true },
  specialEffects: { ornaments: true },
  sections: [...SECTIONS_PREMIUM],
  variants: {
    wedding: {
      palette: {
        primary: '#8B0000',
        secondary: '#D4AF37',
        bg: '#0D0D0D',
        bgWarm: '#1A1410',
        text: '#F5E6D3',
        textMuted: '#BFA98A',
        accent: '#D4AF37',
        heroOverlay: HERO_OVERLAY_DARK,
      },
      defaultHeroImages: heroImages('wedding', 'royal', 5),
      particles: 'petals',
    },
    birthday: {
      palette: {
        primary: '#B71C1C',
        secondary: '#FFD700',
        bg: '#0D0D0D',
        bgWarm: '#1A1414',
        text: '#F5E6D3',
        textMuted: '#BFA98A',
        accent: '#FFD700',
        heroOverlay: HERO_OVERLAY_DARK,
      },
      defaultHeroImages: heroImages('birthday', 'royal', 5),
      particles: 'balloons',
    },
    baptism: {
      palette: {
        primary: '#1565C0',
        secondary: '#C5CAE9',
        bg: '#0D0D14',
        bgWarm: '#101828',
        text: '#E8EAF6',
        textMuted: '#9FA8DA',
        accent: '#C5CAE9',
        heroOverlay: HERO_OVERLAY_DARK,
      },
      defaultHeroImages: heroImages('baptism', 'royal', 5),
      particles: 'doves',
    },
    party: {
      palette: {
        primary: '#4A148C',
        secondary: '#FFD700',
        bg: '#0A0A14',
        bgWarm: '#12101E',
        text: '#EDE7F6',
        textMuted: '#B39DDB',
        accent: '#FFD700',
        heroOverlay: HERO_OVERLAY_DARK,
      },
      defaultHeroImages: heroImages('party', 'royal', 5),
      particles: 'stars',
    },
    babyshower: {
      palette: {
        primary: '#880E4F',
        secondary: '#F8BBD0',
        bg: '#0D0D0D',
        bgWarm: '#1A1018',
        text: '#FCE4EC',
        textMuted: '#F48FB1',
        accent: '#F8BBD0',
        heroOverlay: HERO_OVERLAY_DARK,
      },
      defaultHeroImages: heroImages('babyshower', 'royal', 5),
      particles: 'hearts',
    },
    corporate: {
      palette: {
        primary: '#0D47A1',
        secondary: '#B0BEC5',
        bg: '#0D0D0D',
        bgWarm: '#0F1520',
        text: '#ECEFF1',
        textMuted: '#90A4AE',
        accent: '#B0BEC5',
        heroOverlay: HERO_OVERLAY_DARK,
      },
      defaultHeroImages: heroImages('corporate', 'royal', 5),
      particles: 'confetti',
    },
    custom: {
      palette: {
        primary: '#6A1B9A',
        secondary: '#D4AF37',
        bg: '#0D0D0D',
        bgWarm: '#160F1E',
        text: '#EDE7F6',
        textMuted: '#CE93D8',
        accent: '#D4AF37',
        heroOverlay: HERO_OVERLAY_DARK,
      },
      defaultHeroImages: heroImages('custom', 'royal', 5),
      particles: 'confetti',
    },
  },
};

// ---------------------------------------------------------------------------
// 5 · Bohème — Premium
// ---------------------------------------------------------------------------

const boheme: TemplateDesign = {
  id: 'boheme',
  name: 'Bohème',
  description:
    'Esprit libre et naturel, tons terreux et textures organiques. Parfait pour les célébrations en plein air.',
  plan: 'premium',
  fonts: { display: 'Amatic SC', body: 'Nunito', script: 'Sacramento' },
  heroTypes: ['image', 'slideshow', 'video'],
  layout: 'classic',
  animations: { entrance: 'fadeUp', transition: 'fade', parallax: true },
  specialEffects: { polaroid: true },
  sections: [...SECTIONS_PREMIUM],
  variants: {
    wedding: {
      palette: {
        primary: '#D2691E',
        secondary: '#9B8B7E',
        bg: '#FEFCF8',
        bgWarm: '#F5EDE4',
        text: '#3E3229',
        textMuted: '#8C7B6B',
        accent: '#CC7722',
        heroOverlay: HERO_OVERLAY_LIGHT,
      },
      defaultHeroImages: heroImages('wedding', 'boheme', 5),
      particles: 'petals',
    },
    birthday: {
      palette: {
        primary: '#E2725B',
        secondary: '#C4A882',
        bg: '#FEFCF8',
        bgWarm: '#F5EDE4',
        text: '#3E3229',
        textMuted: '#8C7B6B',
        accent: '#E2725B',
        heroOverlay: HERO_OVERLAY_LIGHT,
      },
      defaultHeroImages: heroImages('birthday', 'boheme', 5),
      particles: 'balloons',
    },
    baptism: {
      palette: {
        primary: '#7EB5A6',
        secondary: '#C9D6C3',
        bg: '#FEFCF8',
        bgWarm: '#F0F5ED',
        text: '#3E3229',
        textMuted: '#8C7B6B',
        accent: '#7EB5A6',
        heroOverlay: HERO_OVERLAY_LIGHT,
      },
      defaultHeroImages: heroImages('baptism', 'boheme', 5),
      particles: 'doves',
    },
    party: {
      palette: {
        primary: '#B8860B',
        secondary: '#A0522D',
        bg: '#1C1710',
        bgWarm: '#2A2318',
        text: '#F5E6D3',
        textMuted: '#BFA98A',
        accent: '#DAA520',
        heroOverlay: HERO_OVERLAY_DARK,
      },
      defaultHeroImages: heroImages('party', 'boheme', 5),
      particles: 'stars',
    },
    babyshower: {
      palette: {
        primary: '#DEB887',
        secondary: '#C9ADA7',
        bg: '#FEFCF8',
        bgWarm: '#FFF5EE',
        text: '#3E3229',
        textMuted: '#8C7B6B',
        accent: '#DEB887',
        heroOverlay: HERO_OVERLAY_LIGHT,
      },
      defaultHeroImages: heroImages('babyshower', 'boheme', 5),
      particles: 'hearts',
    },
    corporate: {
      palette: {
        primary: '#6B705C',
        secondary: '#A5A58D',
        bg: '#FEFCF8',
        bgWarm: '#F2EFE5',
        text: '#3E3229',
        textMuted: '#8C7B6B',
        accent: '#6B705C',
        heroOverlay: HERO_OVERLAY_LIGHT,
      },
      defaultHeroImages: heroImages('corporate', 'boheme', 5),
      particles: 'confetti',
    },
    custom: {
      palette: {
        primary: '#8B6F47',
        secondary: '#C4A882',
        bg: '#FEFCF8',
        bgWarm: '#F5EDE4',
        text: '#3E3229',
        textMuted: '#8C7B6B',
        accent: '#8B6F47',
        heroOverlay: HERO_OVERLAY_LIGHT,
      },
      defaultHeroImages: heroImages('custom', 'boheme', 5),
      particles: 'confetti',
    },
  },
};

// ---------------------------------------------------------------------------
// 6 · Cinématique — Premium
// ---------------------------------------------------------------------------

const cinematique: TemplateDesign = {
  id: 'cinematique',
  name: 'Cinématique',
  description:
    'Ambiance cinéma et grain argentique. Un style dramatique et immersif pour des événements inoubliables.',
  plan: 'premium',
  fonts: { display: 'Bebas Neue', body: 'Source Sans 3', script: 'Great Vibes' },
  heroTypes: ['image', 'slideshow', 'video'],
  layout: 'editorial',
  animations: { entrance: 'slideIn', transition: 'zoom', parallax: true },
  specialEffects: { filmGrain: true },
  sections: [...SECTIONS_PREMIUM],
  variants: {
    wedding: {
      palette: {
        primary: '#1A1A2E',
        secondary: '#E94560',
        bg: '#0F0F0F',
        bgWarm: '#16131A',
        text: '#F0F0F0',
        textMuted: '#A0A0B0',
        accent: '#E94560',
        heroOverlay: HERO_OVERLAY_DARK,
      },
      defaultHeroImages: heroImages('wedding', 'cinematique', 5),
      particles: 'petals',
    },
    birthday: {
      palette: {
        primary: '#1A1A2E',
        secondary: '#FF6F61',
        bg: '#0F0F0F',
        bgWarm: '#1A1516',
        text: '#F0F0F0',
        textMuted: '#A0A0B0',
        accent: '#FF6F61',
        heroOverlay: HERO_OVERLAY_DARK,
      },
      defaultHeroImages: heroImages('birthday', 'cinematique', 5),
      particles: 'balloons',
    },
    baptism: {
      palette: {
        primary: '#1A1A2E',
        secondary: '#64B5F6',
        bg: '#0F0F0F',
        bgWarm: '#0F1520',
        text: '#F0F0F0',
        textMuted: '#A0A0B0',
        accent: '#64B5F6',
        heroOverlay: HERO_OVERLAY_DARK,
      },
      defaultHeroImages: heroImages('baptism', 'cinematique', 5),
      particles: 'doves',
    },
    party: {
      palette: {
        primary: '#1A1A2E',
        secondary: '#BB86FC',
        bg: '#0F0F0F',
        bgWarm: '#14101E',
        text: '#F0F0F0',
        textMuted: '#A0A0B0',
        accent: '#BB86FC',
        heroOverlay: HERO_OVERLAY_DARK,
      },
      defaultHeroImages: heroImages('party', 'cinematique', 5),
      particles: 'stars',
    },
    babyshower: {
      palette: {
        primary: '#1A1A2E',
        secondary: '#F48FB1',
        bg: '#0F0F0F',
        bgWarm: '#1A1018',
        text: '#F0F0F0',
        textMuted: '#A0A0B0',
        accent: '#F48FB1',
        heroOverlay: HERO_OVERLAY_DARK,
      },
      defaultHeroImages: heroImages('babyshower', 'cinematique', 5),
      particles: 'hearts',
    },
    corporate: {
      palette: {
        primary: '#1A1A2E',
        secondary: '#78909C',
        bg: '#0F0F0F',
        bgWarm: '#121820',
        text: '#F0F0F0',
        textMuted: '#A0A0B0',
        accent: '#78909C',
        heroOverlay: HERO_OVERLAY_DARK,
      },
      defaultHeroImages: heroImages('corporate', 'cinematique', 5),
      particles: 'confetti',
    },
    custom: {
      palette: {
        primary: '#1A1A2E',
        secondary: '#CE93D8',
        bg: '#0F0F0F',
        bgWarm: '#160F1E',
        text: '#F0F0F0',
        textMuted: '#A0A0B0',
        accent: '#CE93D8',
        heroOverlay: HERO_OVERLAY_DARK,
      },
      defaultHeroImages: heroImages('custom', 'cinematique', 5),
      particles: 'confetti',
    },
  },
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const TEMPLATE_REGISTRY: TemplateDesign[] = [
  classique,
  romance,
  moderne,
  royal,
  boheme,
  cinematique,
];

const PLAN_TEMPLATES: Record<string, string[]> = {
  essentiel: ['romance'],
  pro: ['classique', 'moderne'],
  premium: ['royal', 'boheme', 'cinematique'],
};

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/**
 * Renvoie les templates disponibles pour un plan et un type d'événement.
 * Inclut les templates du plan demandé uniquement (pas de cascade).
 */
export function getTemplatesForPlan(
  plan: 'essentiel' | 'pro' | 'premium',
  eventType: string,
): TemplateDesign[] {
  const ids = PLAN_TEMPLATES[plan] ?? [];
  return TEMPLATE_REGISTRY.filter(
    (t) => ids.includes(t.id) && t.variants[eventType] !== undefined,
  );
}

/**
 * Récupère un template par son identifiant.
 */
export function getTemplate(templateId: string): TemplateDesign | undefined {
  return TEMPLATE_REGISTRY.find((t) => t.id === templateId);
}

/**
 * Renvoie le template par défaut (imposé) pour le plan Essentiel.
 */
export function getDefaultTemplate(eventType: string): TemplateDesign {
  // Le template « Romance » est toujours le template par défaut.
  const template = TEMPLATE_REGISTRY.find((t) => t.id === 'romance');
  if (!template) {
    throw new Error('Le template par défaut « Romance » est introuvable dans le registre.');
  }
  return template;
}

/**
 * Renvoie l'ensemble des templates disponibles.
 */
export function getAllTemplates(): TemplateDesign[] {
  return [...TEMPLATE_REGISTRY];
}

/**
 * Récupère la variante d'un template pour un type d'événement donné.
 */
export function getTemplateVariant(
  templateId: string,
  eventType: string,
): TemplateVariant | undefined {
  const template = getTemplate(templateId);
  return template?.variants[eventType];
}
