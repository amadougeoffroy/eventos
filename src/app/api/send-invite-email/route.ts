import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/supabase/auth-server';
import { buildInvitationEmail, buildReminderEmail, buildSeatingEmail } from '@/lib/email-templates';

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

// POST /api/send-invite-email
// Body: { to, guestName, event, type?, link?, tableName?, planLink? }
//   type: 'invitation' (default) | 'reminder' | 'seating'
//   'invitation' / 'reminder' need `link` (the public invitation URL)
//   'seating' needs `tableName` and `planLink`
// Sends the email via Brevo's transactional email API. Requires BREVO_API_KEY
// (and optionally BREVO_SENDER_EMAIL/BREVO_SENDER_NAME) — otherwise returns a
// clear 501 instead of failing silently. Dashboard-only (auth required).
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

    const body = await req.json();
    const { to, guestName, event, type = 'invitation' } = body as {
      to: string; guestName: string; event: EmailEventInfo; type?: string;
      link?: string; tableName?: string; planLink?: string;
    };

    if (!to || !event?.name) {
      return NextResponse.json({ error: 'to and event are required' }, { status: 400 });
    }

    let content: { subject: string; html: string };
    if (type === 'reminder') {
      if (!body.link) return NextResponse.json({ error: 'link is required for reminder emails' }, { status: 400 });
      content = buildReminderEmail({ guestName, event, link: body.link });
    } else if (type === 'seating') {
      if (!body.tableName || !body.planLink) {
        return NextResponse.json({ error: 'tableName and planLink are required for seating emails' }, { status: 400 });
      }
      content = buildSeatingEmail({ guestName, event, tableName: body.tableName, planLink: body.planLink });
    } else {
      if (!body.link) return NextResponse.json({ error: 'link is required for invitation emails' }, { status: 400 });
      content = buildInvitationEmail({ guestName, event, link: body.link });
    }

    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'invitations@eventos.app';
    const senderName = process.env.BREVO_SENDER_NAME || 'EventOS';

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: senderName },
        to: [{ email: to, name: (guestName || '').trim() || undefined }],
        subject: content.subject,
        htmlContent: content.html,
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
