import { formatEventDateFr } from './utils';
import type { Event } from './types';

// Server-side only (imported from API routes) — builds the subject + HTML
// body for every transactional email EventOS sends via Brevo. Keeping the
// three templates here, sharing one branded wrapper, avoids each API route
// re-implementing its own inline HTML.

interface EmailEventInfo {
  name: string;
  date: string;
  time: string;
  venue: string;
  venueAddress?: string;
  dressCode?: string;
  coverPhoto?: string;
  primaryColor?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrapEmail({
  accentColor,
  coverPhoto,
  preheader,
  body,
}: {
  accentColor: string;
  coverPhoto?: string;
  preheader: string;
  body: string;
}): string {
  return `
    <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #FFFFFF;">
      <span style="display: none; max-height: 0; overflow: hidden;">${escapeHtml(preheader)}</span>
      ${coverPhoto ? `
        <div style="width: 100%; height: 160px; background: url('${coverPhoto}') center/cover;"></div>
      ` : ''}
      <div style="padding: 28px 24px;">
        ${body}
      </div>
      <div style="padding: 20px 24px; border-top: 1px solid #F0EBE3; text-align: center;">
        <p style="color: #9B9590; font-size: 0.75rem; margin: 0;">
          Propulsé par <span style="color: ${accentColor}; font-weight: 600;">EventOS</span>
        </p>
      </div>
    </div>
  `;
}

function eventDetailsBlock(event: EmailEventInfo, accentColor: string): string {
  return `
    <div style="background: #FAF7F2; border-radius: 12px; padding: 16px 18px; margin: 20px 0;">
      <p style="margin: 0 0 6px; color: #2D2A26; font-weight: 600;">${escapeHtml(event.name)}</p>
      <p style="margin: 0 0 4px; color: #5A5550; font-size: 0.9rem;">📅 ${formatEventDateFr(event.date, { weekday: true })} — ${escapeHtml(event.time)}</p>
      <p style="margin: 0; color: #5A5550; font-size: 0.9rem;">📍 ${escapeHtml(event.venue)}${event.venueAddress ? `, ${escapeHtml(event.venueAddress)}` : ''}</p>
      ${event.dressCode ? `<p style="margin: 8px 0 0; color: #5A5550; font-size: 0.85rem;">👗 Dress code : ${escapeHtml(event.dressCode)}</p>` : ''}
    </div>
  `;
}

function ctaButton(label: string, url: string, accentColor: string): string {
  return `
    <p style="text-align: center; margin: 28px 0 16px;">
      <a href="${url}" style="background: ${accentColor}; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
        ${escapeHtml(label)}
      </a>
    </p>
    <p style="color: #9B9590; font-size: 0.75rem; text-align: center; word-break: break-all;">${url}</p>
  `;
}

// Shared shape passed from the dashboard when calling /api/send-invite-email —
// trims an Event down to just what the email templates render.
export function eventEmailInfo(event: Event): EmailEventInfo {
  return {
    name: event.name,
    date: event.date,
    time: event.time,
    venue: event.venue,
    venueAddress: event.venueAddress,
    dressCode: event.dressCode,
    coverPhoto: event.coverPhoto || event.heroImages?.[0],
    primaryColor: event.primaryColor,
  };
}

export function buildInvitationEmail(params: {
  guestName: string;
  event: EmailEventInfo;
  link: string;
}): { subject: string; html: string } {
  const accentColor = params.event.primaryColor || '#C8A96E';
  const guestName = params.guestName.trim() || 'à vous';
  const body = `
    <h2 style="color: #2D2A26; margin: 0 0 12px;">Bonjour ${escapeHtml(guestName)},</h2>
    <p style="color: #5A5550; line-height: 1.6; margin: 0;">
      Vous êtes invité(e) à <strong>${escapeHtml(params.event.name)}</strong> ! Retrouvez tous les détails et confirmez votre présence en un clic.
    </p>
    ${eventDetailsBlock(params.event, accentColor)}
    ${ctaButton("Voir l'invitation", params.link, accentColor)}
  `;
  return {
    subject: `Vous êtes invité(e) — ${params.event.name}`,
    html: wrapEmail({ accentColor, coverPhoto: params.event.coverPhoto, preheader: `Invitation à ${params.event.name}`, body }),
  };
}

export function buildReminderEmail(params: {
  guestName: string;
  event: EmailEventInfo;
  link: string;
}): { subject: string; html: string } {
  const accentColor = params.event.primaryColor || '#C8A96E';
  const guestName = params.guestName.trim() || 'à vous';
  const body = `
    <h2 style="color: #2D2A26; margin: 0 0 12px;">Petit rappel, ${escapeHtml(guestName)} !</h2>
    <p style="color: #5A5550; line-height: 1.6; margin: 0;">
      Nous n'avons pas encore reçu votre réponse pour <strong>${escapeHtml(params.event.name)}</strong>. Prenez un instant pour nous dire si vous serez des nôtres — ça nous aide beaucoup à nous organiser !
    </p>
    ${eventDetailsBlock(params.event, accentColor)}
    ${ctaButton('Confirmer ma présence', params.link, accentColor)}
  `;
  return {
    subject: `Rappel — confirmez votre présence à ${params.event.name}`,
    html: wrapEmail({ accentColor, coverPhoto: params.event.coverPhoto, preheader: `Il vous reste à confirmer votre présence à ${params.event.name}`, body }),
  };
}

export function buildSeatingEmail(params: {
  guestName: string;
  event: EmailEventInfo;
  tableName: string;
  planLink: string;
}): { subject: string; html: string } {
  const accentColor = params.event.primaryColor || '#C8A96E';
  const guestName = params.guestName.trim() || 'à vous';
  const body = `
    <h2 style="color: #2D2A26; margin: 0 0 12px;">Votre place est prête, ${escapeHtml(guestName)} !</h2>
    <p style="color: #5A5550; line-height: 1.6; margin: 0;">
      Voici votre emplacement pour <strong>${escapeHtml(params.event.name)}</strong> :
    </p>
    <div style="text-align: center; margin: 20px 0;">
      <div style="display: inline-block; background: ${accentColor}; color: #fff; padding: 10px 24px; border-radius: 999px; font-weight: 700; font-size: 1.1rem;">
        🍽️ ${escapeHtml(params.tableName)}
      </div>
    </div>
    ${eventDetailsBlock(params.event, accentColor)}
    ${ctaButton('Voir le plan de table', params.planLink, accentColor)}
  `;
  return {
    subject: `Votre table pour ${params.event.name} : ${params.tableName}`,
    html: wrapEmail({ accentColor, coverPhoto: params.event.coverPhoto, preheader: `Votre table : ${params.tableName}`, body }),
  };
}
