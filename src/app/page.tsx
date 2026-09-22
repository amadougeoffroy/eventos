'use client';
import { motion, Variants, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';
import {
  Sparkles, Send, UtensilsCrossed, LayoutGrid, BarChart3,
  QrCode, Users, ArrowRight, CheckCircle2, Star, Zap, Menu, X,
  ChevronDown, Play, Shield, Clock, Headphones
} from 'lucide-react';
import { eventTypeConfig } from '@/lib/mock-data';

const heroParticles = Array.from({ length: 30 }, (_, i) => ({
  w: ((i * 5 + 2) % 6) + 2,
  left: ((i * 37 + 13) % 100),
  top: ((i * 23 + 7) % 100),
  dur: 4 + ((i * 11) % 5),
  delay: (i * 0.4) % 4,
  color: i % 3 === 0 ? 'rgba(200,169,110,0.4)' : i % 3 === 1 ? 'rgba(232,196,192,0.35)' : 'rgba(167,139,250,0.25)',
}));

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }
  })
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: { delay: i * 0.08, duration: 0.6 }
  })
};

const features = [
  { icon: Send, title: "Invitations digitales", desc: "Liens personnalisés ou génériques, envoi par email, SMS, WhatsApp. Animations uniques par type d'événement.", color: "#D4AF37", bg: "rgba(212,175,55,0.08)", border: "rgba(212,175,55,0.2)", number: "01" },
  { icon: Users, title: "RSVP intelligent", desc: "Suivi en temps réel : confirmés, déclinés, en attente. Relances automatiques. Dashboard complet.", color: "#4ADE80", bg: "rgba(74,222,128,0.07)", border: "rgba(74,222,128,0.18)", number: "02" },
  { icon: UtensilsCrossed, title: "Menu & Sondage", desc: "Créez votre menu, sondez vos invités, recueillez les choix à l'avance. Zéro gaspillage.", color: "#FB923C", bg: "rgba(251,146,60,0.07)", border: "rgba(251,146,60,0.18)", number: "03" },
  { icon: LayoutGrid, title: "Plan de salle", desc: "Éditeur visuel drag & drop. Assignation des invités. Suggestions IA d'optimisation.", color: "#60A5FA", bg: "rgba(96,165,250,0.07)", border: "rgba(96,165,250,0.18)", number: "04" },
  { icon: QrCode, title: "Service Jour J", desc: "QR codes par table, commandes en temps réel, Kitchen Display System, suivi de service.", color: "#C084FC", bg: "rgba(192,132,252,0.07)", border: "rgba(192,132,252,0.18)", number: "05" },
  { icon: BarChart3, title: "Analytics complets", desc: "Statistiques RSVP, choix menu, satisfaction invités. Export traiteur automatique.", color: "#F472B6", bg: "rgba(244,114,182,0.07)", border: "rgba(244,114,182,0.18)", number: "06" },
];

const pricing = [
  { name: "Essentiel", price: "19 000", currency: "FCFA", period: "/événement", desc: "Parfait pour débuter", icon: "⭐", features: ["100 invités", "Invitations & RSVP", "Landing animée", "Dashboard RSVP", "Lien personnalisé"], popular: false, cta: "Commencer" },
  { name: "Pro", price: "49 000", currency: "FCFA", period: "/événement", desc: "Le plus populaire", icon: "🚀", features: ["300 invités", "Tout Essentiel +", "Menu & sondage", "Plan de salle", "Relances automatiques", "Export traiteur"], popular: true, cta: "Choisir Pro" },
  { name: "Premium", price: "99 000", currency: "FCFA", period: "/événement", desc: "L'expérience ultime", icon: "💎", features: ["Invités illimités", "Tout Pro +", "Live Jour J (QR)", "Kitchen Display", "Waiter App", "Analytics avancés", "URL personnalisé"], popular: false, cta: "Passer Premium" },
];

const trustItems = [
  { icon: Shield, label: "Données sécurisées" },
  { icon: Clock, label: "Disponible 24/7" },
  { icon: Headphones, label: "Support dédié" },
];

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="home-root">
      {/* ── Navbar ── */}
      <nav className={`home-nav ${scrolled ? 'home-nav--scrolled' : ''}`}>
        <div className="home-nav__inner">
          <Link href="/" className="home-nav__logo">
            <div className="home-nav__logo-icon">
              <Sparkles size={18} color="#FFF" />
            </div>
            <span className="home-nav__logo-text">EventOS</span>
          </Link>

          <div className="home-nav__links">
            <a href="#features">Fonctionnalités</a>
            <a href="#types">Événements</a>
            <a href="#how">Comment ça marche</a>
            <a href="#pricing">Tarifs</a>
          </div>

          <div className="home-nav__cta">
            <Link href="/login" className="home-nav__login">Connexion</Link>
            <Link href="/dashboard" className="home-nav__btn">
              Commencer <ArrowRight size={15} />
            </Link>
          </div>

          <button
            className="home-nav__hamburger"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <motion.div
            className="home-nav__mobile"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Fonctionnalités</a>
            <a href="#types" onClick={() => setMobileMenuOpen(false)}>Événements</a>
            <a href="#how" onClick={() => setMobileMenuOpen(false)}>Comment ça marche</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Tarifs</a>
            <div className="home-nav__mobile-cta">
              <Link href="/login" className="home-nav__login" onClick={() => setMobileMenuOpen(false)}>Connexion</Link>
              <Link href="/dashboard" className="home-nav__btn" onClick={() => setMobileMenuOpen(false)}>
                Commencer <ArrowRight size={15} />
              </Link>
            </div>
          </motion.div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section ref={heroRef} className="home-hero">
        <motion.div className="home-hero__bg" style={{ y: heroY, opacity: heroOpacity }}>
          <div className="home-hero__mesh" />
          <div className="home-hero__glow home-hero__glow--1" />
          <div className="home-hero__glow home-hero__glow--2" />
          <div className="home-hero__glow home-hero__glow--3" />
          <div className="home-hero__orb home-hero__orb--1" />
          <div className="home-hero__orb home-hero__orb--2" />
          <div className="home-hero__grid" />
        </motion.div>

        <div className="home-hero__particles" aria-hidden="true">
          {heroParticles.map((p, i) => (
            <motion.div
              key={i}
              className="home-hero__particle"
              style={{ width: p.w, height: p.w, background: p.color, left: `${p.left}%`, top: `${p.top}%` }}
              animate={{ y: [0, -50, 0], opacity: [0.1, 0.8, 0.1], scale: [1, 1.4, 1] }}
              transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
            />
          ))}
        </div>

        <div className="home-hero__content">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <span className="home-hero__badge">
              <Zap size={13} />
              Nouveau — Plateforme événementielle révolutionnaire
            </span>
          </motion.div>

          <motion.h1 className="home-hero__title" initial="hidden" animate="visible" variants={fadeUp} custom={1}>
            Vos événements,<br />
            <span className="gradient-gold">réinventés</span>
          </motion.h1>

          <motion.p className="home-hero__subtitle" initial="hidden" animate="visible" variants={fadeUp} custom={2}>
            Du premier clic d&apos;invitation au dernier plat servi. Gérez vos mariages, anniversaires,
            baptêmes et tous vos événements sur une seule plateforme intelligente.
          </motion.p>

          <motion.div className="home-hero__actions" initial="hidden" animate="visible" variants={fadeUp} custom={3}>
            <Link href="/dashboard" className="home-hero__cta-primary">
              Créer mon événement <ArrowRight size={18} />
            </Link>
            <Link href="/e/mariage-amadou-et-fatou-2026" className="home-hero__cta-secondary">
              <Play size={16} style={{ fill: 'currentColor' }} />
              Voir une démo
            </Link>
          </motion.div>

          <motion.div className="home-hero__stats" initial="hidden" animate="visible" variants={fadeUp} custom={4}>
            {[
              { value: "10k+", label: "Événements créés" },
              { value: "95%", label: "Taux de satisfaction" },
              { value: "4.9★", label: "Note moyenne" },
            ].map((s) => (
              <div key={s.label} className="home-hero__stat">
                <div className="home-hero__stat-value gradient-gold">{s.value}</div>
                <div className="home-hero__stat-label">{s.label}</div>
              </div>
            ))}
          </motion.div>

          <motion.div className="home-hero__scroll" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
            <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
              <ChevronDown size={22} style={{ color: 'var(--gold)' }} />
            </motion.div>
          </motion.div>
        </div>

        <motion.div className="home-hero__trust" initial="hidden" animate="visible" variants={fadeIn} custom={6}>
          {trustItems.map(({ icon: Icon, label }) => (
            <div key={label} className="home-hero__trust-item">
              <Icon size={15} style={{ color: 'var(--gold)' }} />
              <span>{label}</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Event Types ── */}
      <section id="types" className="home-section home-types">
        <div className="home-container">
          <motion.div className="home-section__header" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <span className="home-section__eyebrow">Tous vos moments</span>
            <h2 className="home-section__title">Pour <span className="gradient-gold">chaque</span> événement</h2>
            <p className="home-section__desc">Une seule plateforme, tous vos moments importants</p>
          </motion.div>
          <div className="home-types__grid">
            {Object.entries(eventTypeConfig).map(([key, cfg], i) => (
              <motion.div
                key={key}
                className="home-type-card"
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i * 0.5}
                whileHover={{ scale: 1.06, y: -4 }}
                whileTap={{ scale: 0.97 }}
              >
                <div className="home-type-card__emoji">{cfg.emoji}</div>
                <div className="home-type-card__label">{cfg.label}</div>
                <div className="home-type-card__dot" style={{ background: cfg.color }} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="home-section home-features">
        <div className="home-features__bg-glow" />
        <div className="home-container">
          <motion.div className="home-section__header" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <span className="home-section__eyebrow">Fonctionnalités</span>
            <h2 className="home-section__title">Tout ce qu&apos;il vous faut,<br /><span className="gradient-gold">rien de plus</span></h2>
            <p className="home-section__desc">6 modules puissants pour une expérience invité parfaite</p>
          </motion.div>
          <div className="home-features__grid">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  className="home-feature-card"
                  initial="hidden" whileInView="visible" viewport={{ once: true }}
                  variants={fadeUp} custom={i * 0.5}
                  whileHover={{ y: -6 }}
                  style={{ '--feature-color': f.color, '--feature-bg': f.bg, '--feature-border': f.border } as React.CSSProperties}
                >
                  <div className="home-feature-card__number">{f.number}</div>
                  <div className="home-feature-card__icon"><Icon size={22} color={f.color} /></div>
                  <h3 className="home-feature-card__title">{f.title}</h3>
                  <p className="home-feature-card__desc">{f.desc}</p>
                  <div className="home-feature-card__glow" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="home-section home-how">
        <div className="home-container home-container--narrow">
          <motion.div className="home-section__header" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <span className="home-section__eyebrow">Simple & efficace</span>
            <h2 className="home-section__title">Simple comme <span className="gradient-gold">1, 2, 3</span></h2>
          </motion.div>
          <div className="home-how__steps">
            {[
              { step: "01", title: "Créez votre événement", desc: "Choisissez le type, renseignez les infos et personnalisez votre landing page animée.", emoji: "✨", color: "#D4AF37" },
              { step: "02", title: "Invitez & recueillez", desc: "Envoyez les invitations, suivez les RSVP en temps réel, sondez vos invités sur le menu.", emoji: "💌", color: "#4ADE80" },
              { step: "03", title: "Vivez le jour J", desc: "Plan de table, QR codes, commandes en temps réel. Service orchestré à la perfection.", emoji: "🎉", color: "#C084FC" },
            ].map((s, i) => (
              <motion.div key={s.step} className="home-step" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <div className="home-step__left">
                  <div className="home-step__circle" style={{ borderColor: `${s.color}40`, boxShadow: `0 0 30px ${s.color}15` }}>
                    <span className="home-step__emoji">{s.emoji}</span>
                    <div className="home-step__badge" style={{ background: s.color }}>{s.step}</div>
                  </div>
                  {i < 2 && <div className="home-step__connector" />}
                </div>
                <div className="home-step__content">
                  <span className="home-step__number" style={{ color: s.color }}>ÉTAPE {s.step}</span>
                  <h3 className="home-step__title">{s.title}</h3>
                  <p className="home-step__desc">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="home-section home-pricing">
        <div className="home-pricing__bg" />
        <div className="home-container">
          <motion.div className="home-section__header" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <span className="home-section__eyebrow">Tarification</span>
            <h2 className="home-section__title">Tarifs <span className="gradient-gold">transparents</span></h2>
            <p className="home-section__desc">Payez par événement, pas d&apos;abonnement caché</p>
          </motion.div>
          <div className="home-pricing__grid">
            {pricing.map((plan, i) => (
              <motion.div
                key={plan.name}
                className={`home-pricing-card ${plan.popular ? 'home-pricing-card--popular' : ''}`}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
                whileHover={{ y: plan.popular ? -2 : -5 }}
              >
                {plan.popular && (
                  <div className="home-pricing-card__badge">
                    <Star size={11} /> Le plus populaire
                  </div>
                )}
                <div className="home-pricing-card__header">
                  <span className="home-pricing-card__icon">{plan.icon}</span>
                  <div>
                    <h3 className="home-pricing-card__name">{plan.name}</h3>
                    <p className="home-pricing-card__desc-text">{plan.desc}</p>
                  </div>
                </div>
                <div className="home-pricing-card__price">
                  <span className="home-pricing-card__amount gradient-gold">{plan.price}</span>
                  <div className="home-pricing-card__currency">
                    <span>{plan.currency}</span>
                    <span className="home-pricing-card__period">{plan.period}</span>
                  </div>
                </div>
                <div className="home-pricing-card__divider" />
                <ul className="home-pricing-card__features">
                  {plan.features.map((f) => (
                    <li key={f}>
                      <CheckCircle2 size={16} className="home-pricing-card__check" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/dashboard"
                  className={plan.popular ? 'home-pricing-card__cta home-pricing-card__cta--primary' : 'home-pricing-card__cta home-pricing-card__cta--secondary'}
                >
                  {plan.cta} <ArrowRight size={15} />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="home-cta">
        <div className="home-cta__bg" />
        <div className="home-cta__orb home-cta__orb--1" />
        <div className="home-cta__orb home-cta__orb--2" />
        <div className="home-container home-container--narrow">
          <motion.div className="home-cta__content" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <span className="home-cta__emoji">🚀</span>
            <h2 className="home-cta__title">Prêt à créer un événement <span className="gradient-gold">inoubliable</span> ?</h2>
            <p className="home-cta__subtitle">Rejoignez des milliers d&apos;organisateurs qui font confiance à EventOS</p>
            <div className="home-cta__actions">
              <Link href="/dashboard" className="home-cta__btn-primary">
                Commencer gratuitement <ArrowRight size={18} />
              </Link>
              <span className="home-cta__note">✓ Aucune carte requise · ✓ Configuration en 2 min</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="home-footer">
        <div className="home-container">
          <div className="home-footer__inner">
            <div className="home-footer__brand">
              <div className="home-footer__logo">
                <div className="home-nav__logo-icon" style={{ width: 30, height: 30 }}>
                  <Sparkles size={15} color="#FFF" />
                </div>
                <span className="home-nav__logo-text">EventOS</span>
              </div>
              <p className="home-footer__tagline">La plateforme intelligente pour vos événements inoubliables.</p>
            </div>
            <div className="home-footer__links">
              <div className="home-footer__col">
                <span className="home-footer__col-title">Produit</span>
                <a href="#features">Fonctionnalités</a>
                <a href="#pricing">Tarifs</a>
                <a href="#types">Événements</a>
              </div>
              <div className="home-footer__col">
                <span className="home-footer__col-title">Compte</span>
                <Link href="/login">Se connecter</Link>
                <Link href="/dashboard">Créer un compte</Link>
              </div>
            </div>
          </div>
          <div className="home-footer__bottom">
            <p>© 2026 EventOS. Tous droits réservés.</p>
            <div className="home-footer__bottom-links">
              <a href="#">Confidentialité</a>
              <a href="#">CGU</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
