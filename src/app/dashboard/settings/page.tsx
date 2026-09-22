'use client';
import Sidebar from '@/components/Sidebar';
import { useApp } from '@/context/AppContext';
import { useThemeLanguage } from '@/context/ThemeLanguageContext';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import ConfirmModal from '@/components/ConfirmModal';
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
  const { currentUser, updateProfile } = useApp();
  const { theme, setTheme, lang, setLang, t } = useThemeLanguage();
  const tr = t('settings');

  // Profile
  const [profileName, setProfileName] = useState(currentUser.name);
  const [profileEmail, setProfileEmail] = useState(currentUser.email);
  const [profilePhone, setProfilePhone] = useState(currentUser.phone || '');
  const [profileSaved, setProfileSaved] = useState(false);

  // Sync local state when currentUser loads from Supabase
  useEffect(() => {
    if (currentUser.id) {
      setProfileName(currentUser.name);
      setProfileEmail(currentUser.email);
      setProfilePhone(currentUser.phone || '');
    }
  }, [currentUser.id, currentUser.name, currentUser.email, currentUser.phone]);

  // Notifications — synced from BD
  const [notifEmail, setNotifEmail] = useState(currentUser.notifEmail ?? true);
  const [notifSms, setNotifSms] = useState(currentUser.notifSms ?? false);
  const [notifRsvp, setNotifRsvp] = useState(currentUser.notifRsvp ?? true);
  const [notifReminder, setNotifReminder] = useState(currentUser.notifReminder ?? true);

  // Sync notification state from BD
  useEffect(() => {
    if (currentUser.id) {
      setNotifEmail(currentUser.notifEmail ?? true);
      setNotifSms(currentUser.notifSms ?? false);
      setNotifRsvp(currentUser.notifRsvp ?? true);
      setNotifReminder(currentUser.notifReminder ?? true);
    }
  }, [currentUser.id, currentUser.notifEmail, currentUser.notifSms, currentUser.notifRsvp, currentUser.notifReminder]);

  // Toggle notification and persist to BD
  const toggleNotif = (key: 'notifEmail' | 'notifSms' | 'notifRsvp' | 'notifReminder', setter: (v: boolean) => void, current: boolean) => {
    const newVal = !current;
    setter(newVal);
    updateProfile({ [key]: newVal });
  };

  // Danger zone
  const [dangerOpen, setDangerOpen] = useState(false);
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const router = useRouter();

  // Change password
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);

  const handleSaveProfile = async () => {
    await updateProfile({ name: profileName, email: profileEmail, phone: profilePhone });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const handleUpdatePassword = async () => {
    setPasswordError('');
    if (newPassword.length < 8) {
      setPasswordError(tr.passwordTooShort);
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError(tr.passwordMismatch);
      return;
    }
    setPasswordSaving(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPasswordError(tr.passwordUpdateError);
      } else {
        setPasswordSaved(true);
        setNewPassword('');
        setConfirmNewPassword('');
        setTimeout(() => { setPasswordSaved(false); setShowPasswordForm(false); }, 1500);
      }
    } catch {
      setPasswordError(tr.passwordUpdateError);
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setConfirmDeleteAccount(false);
    setDeletingAccount(true);
    setDeleteError('');
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'delete failed');
      }
      await supabase.auth.signOut();
      router.push('/login');
    } catch (e) {
      console.error('Error deleting account:', e);
      setDeleteError(tr.deleteAccountError);
      setDeletingAccount(false);
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="main-content">
        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}
          style={{ marginBottom: '2rem' }}
        >
          <h1 className="font-display text-2xl font-bold" style={{ marginBottom: '0.25rem' }}>{tr.title}</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{tr.subtitle}</p>
        </motion.div>

        <div className="settings-sections" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* ── Profile ──────────────────── */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
            <SectionCard title={tr.profile} icon={User}>
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
                    {currentUser.createdAt && (
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {tr.memberSince} {new Date(currentUser.createdAt).toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { month: 'long', year: 'numeric' })}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="label"><User size={12} style={{ display: 'inline', marginRight: 4 }} />{tr.fullName}</label>
                  <input className="input" value={profileName} onChange={e => setProfileName(e.target.value)} />
                </div>
                <div className="settings-profile-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label className="label"><Mail size={12} style={{ display: 'inline', marginRight: 4 }} />{tr.email}</label>
                    <input className="input" type="email" value={profileEmail} onChange={e => setProfileEmail(e.target.value)} />
                  </div>
                  <div>
                    <label className="label"><Phone size={12} style={{ display: 'inline', marginRight: 4 }} />{tr.phone}</label>
                    <input className="input" type="tel" value={profilePhone} onChange={e => setProfilePhone(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="label"><Shield size={12} style={{ display: 'inline', marginRight: 4 }} />{tr.password}</label>
                  <input className="input" type="password" value="••••••••" readOnly style={{ cursor: 'not-allowed', opacity: 0.7 }} />
                  <button
                    className="text-xs"
                    onClick={() => setShowPasswordForm(v => !v)}
                    style={{
                      color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer',
                      marginTop: '0.35rem', fontWeight: 500,
                    }}
                  >{tr.changePassword}</button>

                  {showPasswordForm && (
                    <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <input
                        className="input" type="password" placeholder={tr.newPassword}
                        value={newPassword} onChange={e => setNewPassword(e.target.value)}
                      />
                      <input
                        className="input" type="password" placeholder={tr.confirmPassword}
                        value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)}
                      />
                      {passwordError && (
                        <p className="text-xs" style={{ color: '#DC3545' }}>{passwordError}</p>
                      )}
                      <button
                        onClick={handleUpdatePassword}
                        disabled={passwordSaving}
                        className="btn-primary"
                        style={{ alignSelf: 'flex-start', opacity: passwordSaving ? 0.6 : 1 }}
                      >
                        {passwordSaved ? <><Check size={16} /> {tr.passwordUpdated}</> : <><Save size={16} /> {tr.updatePassword}</>}
                      </button>
                    </div>
                  )}
                </div>

                <button onClick={handleSaveProfile} className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: '0.25rem' }}>
                  {profileSaved ? <><Check size={16} /> {tr.saved}</> : <><Save size={16} /> {tr.save}</>}
                </button>
              </div>
            </SectionCard>
          </motion.div>

          {/* ── Notifications ────────────── */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
            <SectionCard title={tr.notifications} icon={Bell}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { label: tr.notifEmail, desc: tr.notifEmailDesc, value: notifEmail, key: 'notifEmail' as const, set: setNotifEmail },
                  { label: tr.notifSms, desc: tr.notifSmsDesc, value: notifSms, key: 'notifSms' as const, set: setNotifSms },
                  { label: tr.notifRsvp, desc: tr.notifRsvpDesc, value: notifRsvp, key: 'notifRsvp' as const, set: setNotifRsvp },
                  { label: tr.notifReminder, desc: tr.notifReminderDesc, value: notifReminder, key: 'notifReminder' as const, set: setNotifReminder },
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
                      onClick={() => toggleNotif(n.key, n.set, n.value)}
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
            <SectionCard title={tr.appearance} icon={Palette}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label className="label">{tr.theme}</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                    {([
                      { value: 'light' as const, label: tr.light, icon: Sun },
                      { value: 'dark' as const, label: tr.dark, icon: Moon },
                      { value: 'system' as const, label: tr.system, icon: Smartphone },
                    ]).map(tOpt => {
                      const TIcon = tOpt.icon;
                      const selected = theme === tOpt.value;
                      return (
                        <button key={tOpt.value} onClick={() => setTheme(tOpt.value)} style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem',
                          padding: '0.85rem 0.5rem', borderRadius: 12, cursor: 'pointer',
                          background: selected ? 'rgba(200,169,110,0.08)' : 'var(--glass)',
                          border: `1.5px solid ${selected ? 'var(--gold)' : 'var(--border-light)'}`,
                          color: selected ? 'var(--gold)' : 'var(--text-muted)',
                          transition: 'all 0.2s ease',
                        }}>
                          <TIcon size={20} />
                          <span className="text-xs font-medium">{tOpt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="label"><Globe size={12} style={{ display: 'inline', marginRight: 4 }} />{tr.language}</label>
                  <select className="input" value={lang} onChange={e => setLang(e.target.value as 'fr' | 'en')}>
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
                  <h2 className="font-display text-lg font-bold" style={{ color: '#DC3545' }}>{tr.dangerZone}</h2>
                </div>
                <ChevronDown size={18} style={{
                  color: '#DC3545', transition: 'transform 0.25s ease',
                  transform: dangerOpen ? 'rotate(180deg)' : 'rotate(0)',
                }} />
              </button>
              {dangerOpen && (
                <div style={{ padding: '0 1.75rem 1.5rem' }}>
                  <p className="text-sm" style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    {tr.dangerDesc}
                  </p>
                  {deleteError && (
                    <p className="text-sm" style={{ color: '#DC3545', marginBottom: '0.75rem' }}>{deleteError}</p>
                  )}
                  <button className="btn-danger" onClick={() => setConfirmDeleteAccount(true)} disabled={deletingAccount} style={{ opacity: deletingAccount ? 0.6 : 1 }}>
                    <Trash2 size={16} /> {deletingAccount ? tr.deletingAccount : tr.deleteAccount}
                  </button>
                </div>
              )}
            </div>
          </motion.div>

        </div>
      </main>

      {/* Delete account confirmation modal */}
      <ConfirmModal
        open={confirmDeleteAccount}
        title={tr.deleteAccountTitle}
        message={tr.deleteAccountMessage}
        confirmLabel={tr.deleteAccountConfirm}
        cancelLabel={tr.deleteAccountCancel}
        variant="danger"
        onConfirm={handleDeleteAccount}
        onCancel={() => setConfirmDeleteAccount(false)}
      />
    </div>
  );
}
