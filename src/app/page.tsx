'use client';
import { motion, Variants } from 'framer-motion';
import Link from 'next/link';
import { useMemo } from 'react';
import { 
  Sparkles, Send, UtensilsCrossed, LayoutGrid, BarChart3, 
  QrCode, Users, ArrowRight, CheckCircle2, Star, Zap
} from 'lucide-react';
import { eventTypeConfig } from '@/lib/mock-data';

// Pre-computed particles to avoid hydration mismatch
const heroParticles = Array.from({ length: 20 }, (_, i) => ({
  w: ((i * 7 + 3) % 4) + 2,
  left: ((i * 37 + 13) % 100),
  top: ((i * 23 + 7) % 100),
  dur: 3 + ((i * 11) % 4),
  delay: (i * 17) % 3,
}));

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' }
  })
};

const features = [
  { icon: Send, title: "Invitations digitales", desc: "Liens personnalisés ou génériques, envoi par email, SMS, WhatsApp. Animations uniques par type d'événement.", color: "#D4AF37" },
  { icon: Users, title: "RSVP intelligent", desc: "Suivi en temps réel : confirmés, déclinés, en attente. Relances automatiques. Dashboard complet.", color: "#4ADE80" },
  { icon: UtensilsCrossed, title: "Menu & Sondage", desc: "Créez votre menu, sondez vos invités, recueillez les choix à l'avance. Zéro gaspillage.", color: "#FB923C" },
  { icon: LayoutGrid, title: "Plan de salle", desc: "Éditeur visuel drag & drop. Assignation des invités. Suggestions IA d'optimisation.", color: "#60A5FA" },
  { icon: QrCode, title: "Service Jour J", desc: "QR codes par table, commandes en temps réel, Kitchen Display System, suivi de service.", color: "#C084FC" },
  { icon: BarChart3, title: "Analytics complets", desc: "Statistiques RSVP, choix menu, satisfaction invités. Export traiteur automatique.", color: "#F472B6" },
];

const pricing = [
  { name: "Essentiel", price: "19 000", currency: "FCFA", period: "/événement", features: ["100 invités", "Invitations & RSVP", "Landing animée", "Dashboard RSVP", "Lien personnalisé"], popular: false },
  { name: "Pro", price: "49 000", currency: "FCFA", period: "/événement", features: ["300 invités", "Tout Essentiel +", "Menu & sondage", "Plan de salle", "Relances automatiques", "Export traiteur"], popular: true },
  { name: "Premium", price: "99 000", currency: "FCFA", period: "/événement", features: ["Invités illimités", "Tout Pro +", "Live Jour J (QR)", "Kitchen Display", "Waiter App", "Analytics avancés", "URL personnalisé"], popular: false },
];

export default function HomePage() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* ── Navbar ──────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass" style={{ borderBottom: '1px solid var(--glass-border)' }}>
        <div className="flex items-center justify-between" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem', height: 64 }}>
          <Link href="/" className="flex items-center gap-2 text-decoration-none">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #C8A96E, #B8944F)' }}>
              <Sparkles size={18} color="#FFFFFF" />
            </div>
            <span className="font-display text-xl font-bold gradient-gold">EventOS</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm" style={{ color: 'var(--text-muted)' }}>Fonctionnalités</a>
            <a href="#types" className="text-sm" style={{ color: 'var(--text-muted)' }}>Événements</a>
            <a href="#pricing" className="text-sm" style={{ color: 'var(--text-muted)' }}>Tarifs</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost">Connexion</Link>
            <Link href="/dashboard" className="btn-primary">
              Commencer <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────── */}
      <section style={{ position: 'relative', paddingTop: '9rem', paddingBottom: '7rem', overflow: 'hidden' }}>
        {/* Mesh gradient background */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(200,169,110,0.08) 0%, transparent 50%), radial-gradient(ellipse 60% 50% at 80% 60%, rgba(232,196,192,0.06) 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 20% 80%, rgba(167,139,250,0.04) 0%, transparent 50%)' }} />

        {/* Animated particles */}
        <div className="absolute inset-0 pointer-events-none">
          {heroParticles.map((p, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: p.w,
                height: p.w,
                background: i % 3 === 0 ? 'rgba(200,169,110,0.35)' : i % 3 === 1 ? 'rgba(232,196,192,0.3)' : 'rgba(167,139,250,0.2)',
                left: `${p.left}%`,
                top: `${p.top}%`,
                filter: 'blur(1px)',
              }}
              animate={{
                y: [0, -40, 0],
                opacity: [0.15, 0.7, 0.15],
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: p.dur,
                repeat: Infinity,
                delay: p.delay,
              }}
            />
          ))}
        </div>

        {/* Dual radial glow */}
        <div style={{ position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)', width: 900, height: 700, borderRadius: '50%', opacity: 0.25, background: 'radial-gradient(circle, rgba(200,169,110,0.15) 0%, transparent 55%)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: 500, height: 500, borderRadius: '50%', opacity: 0.15, background: 'radial-gradient(circle, rgba(232,196,192,0.2) 0%, transparent 60%)' }} />

        <div style={{ position: 'relative', maxWidth: 1024, margin: '0 auto', padding: '0 1.5rem', textAlign: 'center' }}>
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <span className="inline-flex items-center gap-2 glass-gold px-4 py-1.5 rounded-full text-sm mb-6" style={{ color: 'var(--gold-dark)' }}>
              <Zap size={14} /> Nouveau — Plateforme événementielle révolutionnaire
            </span>
          </motion.div>

          <motion.h1
            className="font-display font-bold leading-tight mb-6"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', letterSpacing: '-0.02em' }}
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
          >
            Vos événements,<br />
            <span className="gradient-gold">réinventés</span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl"
            style={{ maxWidth: 672, margin: '0 auto 2.5rem', color: 'var(--text-muted)' }}

            initial="hidden" animate="visible" variants={fadeUp} custom={2}
          >
            Du premier clic d'invitation au dernier plat servi. Gérez vos mariages, anniversaires, 
            baptêmes et tous vos événements sur une seule plateforme intelligente.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial="hidden" animate="visible" variants={fadeUp} custom={3}
          >
            <Link href="/dashboard" className="btn-primary text-base px-8 py-3">
              Créer mon événement <ArrowRight size={18} />
            </Link>
            <Link href="/e/mariage-amadou-et-fatou-2026" className="btn-secondary text-base px-8 py-3">
              Voir une démo
            </Link>
          </motion.div>

          {/* Stats strip */}
          <motion.div 
            className="grid grid-cols-3 gap-8"
            style={{ maxWidth: 512, margin: '4rem auto 0' }}
            initial="hidden" animate="visible" variants={fadeUp} custom={4}
          >
            {[
              { value: "10k+", label: "Événements" },
              { value: "95%", label: "Taux RSVP" },
              { value: "4.9★", label: "Satisfaction" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-bold gradient-gold">{s.value}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Event Types ─────────────────────────────── */}
      <section id="types" style={{ padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: 1152, margin: '0 auto' }}>
          <motion.div style={{ textAlign: 'center', marginBottom: '3.5rem' }} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
              Pour <span className="gradient-gold">chaque</span> événement
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>Une seule plateforme, tous vos moments importants</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {Object.entries(eventTypeConfig).map(([key, cfg], i) => (
              <motion.div
                key={key}
                className="card card-hover text-center py-6 cursor-pointer"
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-3xl mb-2">{cfg.emoji}</div>
                <div className="text-sm font-medium">{cfg.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────── */}
      <section id="features" style={{ padding: '5rem 1.5rem', background: 'var(--bg-section)' }}>
        <div style={{ maxWidth: 1152, margin: '0 auto' }}>
          <motion.div style={{ textAlign: 'center', marginBottom: '3.5rem' }} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
              Tout ce qu&apos;il vous faut, <span className="gradient-gold">rien de plus</span>
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>6 modules puissants pour une expérience invité parfaite</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  className="card card-hover"
                  style={{ position: 'relative', overflow: 'hidden' }}
                  initial="hidden" whileInView="visible" viewport={{ once: true }}
                  variants={fadeUp} custom={i}
                  whileHover={{ y: -5 }}
                >
                  <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: `${f.color}08`, pointerEvents: 'none' }} />
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${f.color}12`, border: `1px solid ${f.color}25`, boxShadow: `0 4px 15px ${f.color}10` }}>
                    <Icon size={22} color={f.color} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────── */}
      <section style={{ padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: 896, margin: '0 auto' }}>
          <motion.div style={{ textAlign: 'center', marginBottom: '3.5rem' }} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
              Simple comme <span className="gradient-gold">1, 2, 3</span>
            </h2>
          </motion.div>
          <div style={{ position: 'relative' }}>
            {/* Vertical line connector */}
            <div style={{ position: 'absolute', left: 27, top: 30, bottom: 30, width: 2, background: 'linear-gradient(to bottom, var(--gold), rgba(200,169,110,0.1))', borderRadius: 2 }} />
            <div className="space-y-10">
              {[
                { step: "01", title: "Créez votre événement", desc: "Choisissez le type, renseignez les infos et personnalisez votre landing page animée.", emoji: "✨" },
                { step: "02", title: "Invitez & recueillez", desc: "Envoyez les invitations, suivez les RSVP en temps réel, sondez vos invités sur le menu.", emoji: "💌" },
                { step: "03", title: "Vivez le jour J", desc: "Plan de table, QR codes, commandes en temps réel. Service orchestré à la perfection.", emoji: "🎉" },
              ].map((s, i) => (
                <motion.div
                  key={s.step}
                  className="flex gap-5 items-start"
                  initial="hidden" whileInView="visible" viewport={{ once: true }}
                  variants={fadeUp} custom={i}
                >
                  <div style={{
                    width: 56, height: 56, borderRadius: 16, flexShrink: 0,
                    background: 'linear-gradient(135deg, rgba(200,169,110,0.12), rgba(200,169,110,0.04))',
                    border: '1.5px solid rgba(200,169,110,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.4rem', position: 'relative', zIndex: 1,
                  }}>{s.emoji}</div>
                  <div style={{ paddingTop: 4 }}>
                    <span className="text-xs font-semibold" style={{ color: 'var(--gold)', letterSpacing: '0.08em' }}>ÉTAPE {s.step}</span>
                    <h3 className="text-xl font-semibold" style={{ marginTop: 2, marginBottom: 4 }}>{s.title}</h3>
                    <p className="text-sm" style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────── */}
      <section id="pricing" style={{ padding: '5rem 1.5rem', background: 'var(--bg-section)' }}>
        <div style={{ maxWidth: 1024, margin: '0 auto' }}>
          <motion.div style={{ textAlign: 'center', marginBottom: '3.5rem' }} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
              Tarifs <span className="gradient-gold">transparents</span>
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>Payez par événement, pas d&apos;abonnement caché</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {pricing.map((plan, i) => (
              <motion.div
                key={plan.name}
                className="card relative"
                style={plan.popular ? { border: '1.5px solid var(--gold)', background: 'var(--gold-bg)' } : {}}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
              >
                {plan.popular && (
                  <div className="text-xs font-semibold"
                    style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', padding: '0.25rem 1rem', borderRadius: 9999, background: 'linear-gradient(135deg, #C8A96E, #B8944F)', color: '#FFFFFF' }}>
                    <Star size={12} className="inline mr-1" /> Populaire
                  </div>
                )}
                <div className="text-center mb-6 pt-2">
                  <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-bold gradient-gold">{plan.price}</span>
                    <span className="text-sm font-medium" style={{ color: 'var(--gold)' }}>{plan.currency}</span>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{plan.period}</span>
                </div>
                <div className="divider" />
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 size={16} style={{ color: '#22964F', flexShrink: 0 }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button className={plan.popular ? "btn-primary w-full" : "btn-secondary w-full"}>
                  Choisir {plan.name}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────── */}
      <section style={{ padding: '6rem 1.5rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, rgba(200,169,110,0.08) 0%, transparent 50%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 80% 50%, rgba(167,139,250,0.04) 0%, transparent 50%)' }} />
        <div style={{ position: 'relative', maxWidth: 672, margin: '0 auto' }}>
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            style={{ display: 'inline-block', marginBottom: '1.5rem' }}
          >
            <span style={{ fontSize: '3rem' }}>🚀</span>
          </motion.div>
          <motion.h2
            className="font-display font-bold mb-4"
            style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', lineHeight: 1.2 }}
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={1}
          >
            Prêt à créer un événement <span className="gradient-gold">inoubliable</span> ?
          </motion.h2>
          <motion.p
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
            style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1.05rem' }}
          >
            Rejoignez des milliers d&apos;organisateurs qui font confiance à EventOS
          </motion.p>
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link href="/dashboard" className="btn-primary text-base px-10 py-3.5">
              Commencer gratuitement <ArrowRight size={18} />
            </Link>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Aucune carte requise</span>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────── */}
      <footer style={{ padding: '2rem 1.5rem', borderTop: '1px solid var(--border-light)' }}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4" style={{ maxWidth: 1152, margin: '0 auto' }}>
          <div className="flex items-center gap-2">
            <Sparkles size={16} style={{ color: 'var(--gold)' }} />
            <span className="font-display font-bold gradient-gold">EventOS</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            © 2026 EventOS. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
