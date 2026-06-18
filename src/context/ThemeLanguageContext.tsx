'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Lang, getTranslations, TranslationSection } from '@/lib/i18n';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeLanguageState {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  lang: Lang;
  setTheme: (t: ThemeMode) => void;
  setLang: (l: Lang) => void;
  t: <S extends TranslationSection>(section: S) => ReturnType<typeof getTranslations<S>>;
}

const ThemeLanguageContext = createContext<ThemeLanguageState | undefined>(undefined);

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeLanguageProvider({ children }: { children: ReactNode }) {
  // Start with defaults that match server render to avoid hydration mismatch
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [lang, setLangState] = useState<Lang>('fr');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // After hydration, read stored preferences from localStorage
  useEffect(() => {
    const storedTheme = (localStorage.getItem('eventos-theme') as ThemeMode) || 'light';
    const storedLang = (localStorage.getItem('eventos-lang') as Lang) || 'fr';
    setThemeState(storedTheme);
    setLangState(storedLang);
    setMounted(true);
  }, []);

  // Resolve theme (system → actual) and apply to DOM
  useEffect(() => {
    if (!mounted) return;
    const resolved = theme === 'system' ? getSystemTheme() : theme;
    setResolvedTheme(resolved);
    document.documentElement.setAttribute('data-theme', resolved);

    // Listen for system changes if theme is 'system'
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        const newTheme = e.matches ? 'dark' : 'light';
        setResolvedTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
      };
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [theme, mounted]);

  // Apply lang attribute
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute('lang', lang);
  }, [lang, mounted]);

  const setTheme = useCallback((t: ThemeMode) => {
    setThemeState(t);
    localStorage.setItem('eventos-theme', t);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem('eventos-lang', l);
  }, []);

  const t = useCallback(<S extends TranslationSection>(section: S) => {
    return getTranslations(section, lang);
  }, [lang]);

  return (
    <ThemeLanguageContext.Provider value={{ theme, resolvedTheme, lang, setTheme, setLang, t }}>
      {children}
    </ThemeLanguageContext.Provider>
  );
}

export function useThemeLanguage() {
  const ctx = useContext(ThemeLanguageContext);
  if (!ctx) throw new Error('useThemeLanguage must be used within ThemeLanguageProvider');
  return ctx;
}
