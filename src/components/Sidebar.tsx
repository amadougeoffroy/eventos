'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Sparkles, Home, PartyPopper, Users, UsersRound, Send, UtensilsCrossed,
  LayoutGrid, Radio, BarChart3, Settings, LogOut, ChevronDown, Plus, MapPin,
  Menu, X, Gift
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useThemeLanguage } from '@/context/ThemeLanguageContext';
import { planConfig } from '@/lib/mock-data';
import { createClient } from '@/lib/supabase/client';

interface SidebarProps {
  eventId?: string;
}

export default function Sidebar({ eventId }: SidebarProps) {
  const pathname = usePathname();
  const { events, currentUser } = useApp();
  const { t } = useThemeLanguage();
  const tr = t('sidebar');
  const [eventsOpen, setEventsOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentEvent = events.find(e => e.id === eventId);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile sidebar open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const mainNav = [
    { href: '/dashboard', icon: Home, label: tr.dashboard },
    { href: '/dashboard/settings', icon: Settings, label: tr.settings },
  ];

  const eventNav = eventId ? [
    { href: `/dashboard/events/${eventId}`, icon: PartyPopper, label: tr.overview },
    { href: `/dashboard/events/${eventId}/groups`, icon: UsersRound, label: tr.groups },
    { href: `/dashboard/events/${eventId}/guests`, icon: Users, label: tr.guests },
    { href: `/dashboard/events/${eventId}/invitations`, icon: Send, label: tr.invitations },
    { href: `/dashboard/events/${eventId}/menu`, icon: UtensilsCrossed, label: tr.menu },
    { href: `/dashboard/events/${eventId}/tables`, icon: LayoutGrid, label: tr.tables },
    { href: `/dashboard/events/${eventId}/venues`, icon: MapPin, label: tr.venues },
    { href: `/dashboard/events/${eventId}/gifts`, icon: Gift, label: tr.gifts },
    { href: `/dashboard/events/${eventId}/live`, icon: Radio, label: tr.live },
    { href: `/dashboard/events/${eventId}/stats`, icon: BarChart3, label: tr.stats },
  ] : [];

  const isActive = (href: string) => {
    if (href === '/dashboard' && pathname === '/dashboard') return true;
    if (href !== '/dashboard' && pathname === href) return true;
    return false;
  };

  const sidebarContent = (
    <>
      {/* ── Logo ──────────────────────── */}
      <div style={{
        padding: '1.25rem 1.25rem',
        borderBottom: '1px solid var(--border-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #C8A96E, #B8944F)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(200,169,110,0.3)',
          }}>
            <Sparkles size={18} color="#FFFFFF" />
          </div>
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <span className="font-display" style={{
              fontSize: '1.15rem', fontWeight: 700,
              background: 'linear-gradient(135deg, #C8A96E, #B8944F)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              EventOS
            </span>
          </Link>
        </div>
        {/* Close button - mobile only */}
        <button
          className="mobile-sidebar-close"
          onClick={() => setMobileOpen(false)}
          style={{
            display: 'none', width: 32, height: 32, borderRadius: 8,
            border: 'none', background: 'var(--glass)', cursor: 'pointer',
            alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)',
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* ── Navigation ────────────────── */}
      <nav style={{
        flex: 1, padding: '0.75rem 0.65rem', overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: '0.15rem',
        WebkitOverflowScrolling: 'touch',
      }}>
        {/* Main nav */}
        <div style={{ marginBottom: '0.5rem' }}>
          <div style={{
            fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: 'var(--text-muted)',
            padding: '0.5rem 0.75rem 0.35rem', opacity: 0.6,
          }}>
            Navigation
          </div>
          {mainNav.map(item => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.65rem',
                  padding: '0.6rem 0.75rem', borderRadius: 10,
                  color: active ? 'var(--gold-dark)' : 'var(--text-muted)',
                  fontSize: '0.85rem', fontWeight: active ? 600 : 500,
                  textDecoration: 'none',
                  background: active ? 'rgba(200,169,110,0.1)' : 'transparent',
                  borderLeft: active ? '3px solid var(--gold)' : '3px solid transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 9,
                  background: active ? 'rgba(200,169,110,0.15)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}>
                  <Icon size={17} />
                </div>
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* ── Events section ─────────── */}
        <div>
          <div style={{
            fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: 'var(--text-muted)',
            padding: '0.5rem 0.75rem 0.35rem', opacity: 0.6,
          }}>
            {tr.myEvents}
          </div>
          <button
            onClick={() => setEventsOpen(!eventsOpen)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.6rem 0.75rem', borderRadius: 10,
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500,
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <PartyPopper size={17} />
              </div>
              {tr.myEvents}
            </span>
            <ChevronDown size={14} style={{
              transform: eventsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }} />
          </button>

          {eventsOpen && (
            <div style={{ marginLeft: '1rem', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
              {events.map(evt => {
                const active = eventId === evt.id;
                return (
                  <Link
                    key={evt.id}
                    href={`/dashboard/events/${evt.id}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.45rem 0.65rem', borderRadius: 8,
                      fontSize: '0.8rem', fontWeight: active ? 600 : 400,
                      color: active ? 'var(--gold-dark)' : 'var(--text-muted)',
                      background: active ? 'rgba(200,169,110,0.1)' : 'transparent',
                      textDecoration: 'none', transition: 'all 0.2s ease',
                    }}
                  >
                    <span style={{ fontSize: '0.95rem', lineHeight: 1 }}>
                      {evt.type === 'wedding' ? '💍' : evt.type === 'birthday' ? '🎂' : '🎉'}
                    </span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{evt.name}</span>
                  </Link>
                );
              })}
              <Link
                href="/dashboard/events/new"
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.45rem 0.65rem', borderRadius: 8,
                  fontSize: '0.8rem', fontWeight: 500,
                  color: 'var(--gold)', textDecoration: 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <Plus size={14} /> {tr.newEvent}
              </Link>
            </div>
          )}
        </div>

        {/* ── Event sub-nav ──────────── */}
        {eventId && currentEvent && (
          <div style={{
            marginTop: '0.75rem', paddingTop: '0.75rem',
            borderTop: '1px solid var(--border-light)',
          }}>
            <div style={{
              fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.08em', color: 'var(--text-muted)',
              padding: '0.25rem 0.75rem 0.35rem',
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              overflow: 'hidden',
            }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.6 }}>{currentEvent.name}</span>
              {currentEvent.plan && planConfig[currentEvent.plan] && (
                <span style={{
                  fontSize: '0.5rem', fontWeight: 700, padding: '0.05rem 0.3rem', borderRadius: 4,
                  background: `${planConfig[currentEvent.plan].color}15`, color: planConfig[currentEvent.plan].color,
                  border: `1px solid ${planConfig[currentEvent.plan].color}30`,
                  letterSpacing: '0.04em', flexShrink: 0,
                }}>{planConfig[currentEvent.plan].label}</span>
              )}
            </div>
            {eventNav.map(item => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.65rem',
                    padding: '0.55rem 0.75rem', borderRadius: 10,
                    color: active ? 'var(--gold-dark)' : 'var(--text-muted)',
                    fontSize: '0.85rem', fontWeight: active ? 600 : 500,
                    textDecoration: 'none',
                    background: active ? 'rgba(200,169,110,0.1)' : 'transparent',
                    borderLeft: active ? '3px solid var(--gold)' : '3px solid transparent',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: active ? 'rgba(200,169,110,0.15)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s ease',
                  }}>
                    <Icon size={16} />
                  </div>
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* ── User footer ──────────────── */}
      <div style={{
        padding: '0.85rem 0.85rem',
        borderTop: '1px solid var(--border-light)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.65rem',
          padding: '0.6rem 0.65rem', borderRadius: 12,
          background: 'rgba(200,169,110,0.04)',
          border: '1px solid var(--border-light)',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #C8A96E, #B8944F)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.85rem', fontWeight: 600, color: '#FFFFFF',
            flexShrink: 0,
          }}>
            {currentUser.name.charAt(0)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentUser.name}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentUser.email}
            </div>
          </div>
          <button
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
              window.location.href = '/login';
            }}
            title={tr.logout}
            style={{
              width: 32, height: 32, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(220,53,69,0.06)',
              border: '1px solid rgba(220,53,69,0.12)',
              color: '#DC3545', cursor: 'pointer',
              flexShrink: 0, transition: 'all 0.2s ease',
            }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* ── Mobile top bar ──────────── */}
      <header className="mobile-topbar">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Menu"
          style={{
            width: 38, height: 38, borderRadius: 10,
            border: 'none', background: 'var(--glass)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text)',
          }}
        >
          <Menu size={20} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'linear-gradient(135deg, #C8A96E, #B8944F)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={14} color="#fff" />
          </div>
          <span className="font-display" style={{
            fontSize: '1rem', fontWeight: 700,
            background: 'linear-gradient(135deg, #C8A96E, #B8944F)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>EventOS</span>
        </div>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'linear-gradient(135deg, #C8A96E, #B8944F)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.75rem', fontWeight: 600, color: '#fff',
        }}>
          {currentUser.name.charAt(0)}
        </div>
      </header>

      {/* ── Mobile backdrop ──────────── */}
      {mobileOpen && (
        <div
          className="mobile-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────── */}
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        {sidebarContent}
      </aside>
    </>
  );
}
