import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/serverRateLimit';
import { isValidEmail } from '@/lib/emailValidation';
import { resend, EMAIL_FROM, SUPPORT_EMAIL, isEmailServiceConfigured } from '@/lib/resend';

export async function POST(request: NextRequest) {
  const rate = checkRateLimit(request, 'contact', 3, 60_000);
  if (!rate.allowed) return NextResponse.json({ error: 'Too many messages. Please try again later.' }, { status: 429 });
  try {
    const body = await request.json() as { name?: unknown; email?: unknown; message?: unknown };
    if (typeof body.name !== 'string' || body.name.trim().length < 1 || body.name.length > 120 || !isValidEmail(body.email) || typeof body.message !== 'string' || body.message.trim().length < 1 || body.message.length > 5000) {
      return NextResponse.json({ error: 'Please provide a valid name, email, and message.' }, { status: 400 });
    }
    if (!isEmailServiceConfigured()) return NextResponse.json({ error: 'Support email is not configured yet.' }, { status: 503 });
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: SUPPORT_EMAIL,
      replyTo: body.email,
      subject: `NeuroNest contact message from ${body.name.trim().slice(0, 80)}`,
      text: `Name: ${body.name.trim()}\nEmail: ${body.email}\n\n${body.message.trim()}`,
    });
    if (result.error) return NextResponse.json({ error: 'Unable to send message.' }, { status: 502 });
    return NextResponse.json({ sent: true });
  } catch { return NextResponse.json({ error: 'Invalid contact request.' }, { status: 400 }); }
}
