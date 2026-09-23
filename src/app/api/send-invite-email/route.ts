import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/supabase/auth-server';

// POST /api/send-invite-email
// Body: { to, guestName, eventName, link }
// Sends the invitation link by email via Brevo's transactional email API.
// Requires BREVO_API_KEY (and optionally BREVO_SENDER_EMAIL/BREVO_SENDER_NAME)
// to be set — otherwise this returns a clear 501 instead of failing silently.
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Email sending is not configured (missing BREVO_API_KEY)' }, { status: 501 });
    }

    const { to, guestName, eventName, link } = await req.json();
    if (!to || !link) {
      return NextResponse.json({ error: 'to and link are required' }, { status: 400 });
    }

    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'invitations@eventos.app';
    const senderName = process.env.BREVO_SENDER_NAME || 'EventOS';
    const safeGuestName = String(guestName || '').trim() || 'à vous';
    const safeEventName = String(eventName || 'notre événement').trim();

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: senderName },
        to: [{ email: to, name: safeGuestName }],
        subject: `Vous êtes invité(e) — ${safeEventName}`,
        htmlContent: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #2D2A26;">Bonjour ${safeGuestName},</h2>
            <p style="color: #5A5550; line-height: 1.6;">
              Vous êtes invité(e) à <strong>${safeEventName}</strong>. Découvrez tous les détails et confirmez votre présence via le lien ci-dessous :
            </p>
            <p style="text-align: center; margin: 32px 0;">
              <a href="${link}" style="background: #C8A96E; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Voir l'invitation
              </a>
            </p>
            <p style="color: #9B9590; font-size: 0.85rem;">${link}</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => res.statusText);
      console.error('Brevo send error:', detail);
      return NextResponse.json({ error: 'Could not send email' }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in /api/send-invite-email:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
