import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string to a readable, capitalized French date
 * (e.g. "Samedi 12 décembre 2026"). Shared by every invitation surface that
 * needs this — the intro splash, the hero, the dashboard template preview —
 * instead of each re-implementing its own toLocaleDateString call.
 */
export function formatEventDateFr(raw: string, options?: { weekday?: boolean }): string {
  if (!raw) return '';
  const includeWeekday = options?.weekday ?? true;
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    const str = d.toLocaleDateString('fr-FR', {
      ...(includeWeekday ? { weekday: 'long' as const } : {}),
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return str.charAt(0).toUpperCase() + str.slice(1);
  } catch {
    return raw;
  }
}
