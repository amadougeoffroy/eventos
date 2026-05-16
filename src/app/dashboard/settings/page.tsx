'use client';
import Sidebar from '@/components/Sidebar';
import { useApp } from '@/context/AppContext';
import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  User, Mail, Phone, Shield, Bell, Palette,
  Trash2, Save, Check, Globe, ChevronDown,
  Moon, Sun, Smartphone,
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' as const }
  })
};

function SectionCard({ title, icon: Icon, children, badge }: {
  title: string; icon: React.ElementType; children: React.ReactNode; badge?: React.ReactNode;
}) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-light)',
      borderRadius: '1.25rem', padding: '1.75rem', boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(200,169,110,0.1)', border: '1px solid rgba(200,169,110,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={18} style={{ color: 'var(--gold)' }} />
          </div>
          <h2 className="font-display text-lg font-bold">{title}</h2>
        </div>
        {badge}
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { currentUser } = useApp();

  // Profile
  const [profileName, setProfileName] = useState(currentUser.name);
  const [profileEmail, setProfileEmail] = useState(currentUser.email);
  const [profilePhone, setProfilePhone] = useState('+225 07 00 00 00');
  const [profileSaved, setProfileSaved] = useState(false);

  // Notifications
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSms, setNotifSms] = useState(false);
  const [notifRsvp, setNotifRsvp] = useState(true);
  const [notifReminder, setNotifReminder] = useState(true);

  // Appearance
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');

  // Language
  const [lang, setLang] = useState('fr');

  // Danger zone
  const [dangerOpen, setDangerOpen] = useState(false);

  const handleSaveProfile = () => {
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="main-content">
        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}
          style={{ marginBottom: '2rem' }}
        >
          <h1 className="font-display text-2xl font-bold" style={{ marginBottom: '0.25rem' }}>Paramètres</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Gérez votre compte et vos préférences</p>
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* ── Profile ──────────────────── */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
            <SectionCard title="Profil" icon={User}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 16,
                    background: 'linear-gradient(135deg, #C8A96E, #B8944F)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.3rem', fontWeight: 700, color: '#fff',
                  }}>
                    {profileName.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold">{profileName}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Membre depuis Mai 2026</div>
                  </div>
                </div>

                <div>
                  <label className="label"><User size={12} style={{ display: 'inline', marginRight: 4 }} />Nom complet</label>
                  <input className="input" value={profileName} onChange={e => setProfileName(e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label className="label"><Mail size={12} style={{ display: 'inline', marginRight: 4 }} />Email</label>
                    <input className="input" type="email" value={profileEmail} onChange={e => setProfileEmail(e.target.value)} />
                  </div>
                  <div>
                    <label className="label"><Phone size={12} style={{ display: 'inline', marginRight: 4 }} />Téléphone</label>
                    <input className="input" type="tel" value={profilePhone} onChange={e => setProfilePhone(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="label"><Shield size={12} style={{ display: 'inline', marginRight: 4 }} />Mot de passe</label>
                  <input className="input" type="password" value="••••••••" readOnly style={{ cursor: 'not-allowed', opacity: 0.7 }} />
                  <button className="text-xs" style={{
                    color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer',
                    marginTop: '0.35rem', fontWeight: 500,
                  }}>Modifier le mot de passe</button>
                </div>

                <button onClick={handleSaveProfile} className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: '0.25rem' }}>
                  {profileSaved ? <><Check size={16} /> Enregistré !</> : <><Save size={16} /> Enregistrer</>}
                </button>
              </div>
            </SectionCard>
          </motion.div>

          {/* ── Notifications ────────────── */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
            <SectionCard title="Notifications" icon={Bell}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { label: 'Notifications par email', desc: 'Recevoir les mises à jour par email', value: notifEmail, set: setNotifEmail },
                  { label: 'Notifications par SMS', desc: 'Recevoir les alertes par SMS', value: notifSms, set: setNotifSms },
                  { label: 'Alertes RSVP', desc: 'Être notifié à chaque nouvelle réponse', value: notifRsvp, set: setNotifRsvp },
                  { label: 'Rappels événement', desc: 'Rappels 7j, 3j et 1j avant l\'événement', value: notifReminder, set: setNotifReminder },
                ].map(n => (
                  <div key={n.label} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.75rem', borderRadius: 12,
                    background: 'var(--glass)', border: '1px solid var(--glass-border)',
                  }}>
                    <div>
                      <div className="text-sm font-medium">{n.label}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{n.desc}</div>
                    </div>
                    <button
                      onClick={() => n.set(!n.value)}
                      style={{
                        width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                        background: n.value ? 'linear-gradient(135deg, var(--gold), var(--gold-light))' : 'var(--border-light)',
                        position: 'relative', transition: 'background 0.25s ease', flexShrink: 0,
                      }}
                    >
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%', background: '#fff',
                        position: 'absolute', top: 3,
                        left: n.value ? 23 : 3,
                        transition: 'left 0.25s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                      }} />
                    </button>
                  </div>
                ))}
              </div>
            </SectionCard>
          </motion.div>

          {/* ── Apparence ────────────────── */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}>
            <SectionCard title="Apparence" icon={Palette}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label className="label">Thème</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                    {([
                      { value: 'light' as const, label: 'Clair', icon: Sun },
                      { value: 'dark' as const, label: 'Sombre', icon: Moon },
                      { value: 'system' as const, label: 'Système', icon: Smartphone },
                    ]).map(t => {
                      const Icon = t.icon;
                      const selected = theme === t.value;
                      return (
                        <button key={t.value} onClick={() => setTheme(t.value)} style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem',
                          padding: '0.85rem 0.5rem', borderRadius: 12, cursor: 'pointer',
                          background: selected ? 'rgba(200,169,110,0.08)' : 'var(--glass)',
                          border: `1.5px solid ${selected ? 'var(--gold)' : 'var(--border-light)'}`,
                          color: selected ? 'var(--gold)' : 'var(--text-muted)',
                          transition: 'all 0.2s ease',
                        }}>
                          <Icon size={20} />
                          <span className="text-xs font-medium">{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="label"><Globe size={12} style={{ display: 'inline', marginRight: 4 }} />Langue</label>
                  <select className="input" value={lang} onChange={e => setLang(e.target.value)}>
                    <option value="fr">🇫🇷 Français</option>
                    <option value="en">🇬🇧 English</option>
                  </select>
                </div>
              </div>
            </SectionCard>
          </motion.div>

          {/* ── Zone danger ─────────────── */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4}>
            <div style={{
              background: 'rgba(220,53,69,0.03)', border: '1px solid rgba(220,53,69,0.15)',
              borderRadius: '1.25rem', overflow: 'hidden',
            }}>
              <button
                onClick={() => setDangerOpen(!dangerOpen)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '1.25rem 1.75rem', background: 'transparent', border: 'none', cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'rgba(220,53,69,0.08)', border: '1px solid rgba(220,53,69,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Trash2 size={18} style={{ color: '#DC3545' }} />
                  </div>
                  <h2 className="font-display text-lg font-bold" style={{ color: '#DC3545' }}>Zone dangereuse</h2>
                </div>
                <ChevronDown size={18} style={{
                  color: '#DC3545', transition: 'transform 0.25s ease',
                  transform: dangerOpen ? 'rotate(180deg)' : 'rotate(0)',
                }} />
              </button>
              {dangerOpen && (
                <div style={{ padding: '0 1.75rem 1.5rem' }}>
                  <p className="text-sm" style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Cette action est irréversible. Toutes vos données seront définitivement supprimées.
                  </p>
                  <button className="btn-danger" onClick={() => {
                    if (confirm('Supprimer définitivement votre compte ? Cette action est irréversible.')) {
                      alert('Compte supprimé (simulation)');
                    }
                  }}>
                    <Trash2 size={16} /> Supprimer mon compte
                  </button>
                </div>
              )}
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  );
}
