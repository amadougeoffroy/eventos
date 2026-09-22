'use client';

// Decorative corner flourishes for templates with `specialEffects.ornaments`
// (royal, opulence) — a subtle nod to engraved wedding-invitation borders.
const Corner = () => (
  <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M4 4C4 4 4 36 4 50C4 60 12 68 22 68C36 68 68 68 68 68"
      stroke="var(--t-accent, #D4AF37)"
      strokeWidth="1"
      opacity="0.85"
    />
    <path d="M4 4C20 4 30 10 30 24" stroke="var(--t-accent, #D4AF37)" strokeWidth="1" opacity="0.6" />
    <circle cx="4" cy="4" r="3" fill="var(--t-accent, #D4AF37)" opacity="0.9" />
  </svg>
);

export default function OrnamentBorder() {
  return (
    <div className="absolute inset-4 sm:inset-6 pointer-events-none z-[4]" aria-hidden="true">
      <div className="absolute top-0 left-0">
        <Corner />
      </div>
      <div className="absolute top-0 right-0" style={{ transform: 'scaleX(-1)' }}>
        <Corner />
      </div>
      <div className="absolute bottom-0 left-0" style={{ transform: 'scaleY(-1)' }}>
        <Corner />
      </div>
      <div className="absolute bottom-0 right-0" style={{ transform: 'scale(-1, -1)' }}>
        <Corner />
      </div>
    </div>
  );
}
