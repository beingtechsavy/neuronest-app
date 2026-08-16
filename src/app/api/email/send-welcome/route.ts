import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendWelcomeEmail } from '@/lib/email-service';

let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      throw new Error('Supabase configuration missing');
    }
    supabaseAdmin = createClient(url, serviceKey);
  }
  return supabaseAdmin;
}

// In-memory idempotency set for sent welcome email user IDs within server process lifetime
const sentWelcomeUserIds = new Set<string>();

export async function POST(request: NextRequest) {
  try {
    const { email, username } = await request.json();

    if (!email || !username) {
      return NextResponse.json(
        { error: 'Email and username are required' },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();

    // Verify target email belongs to a legitimate auth user created within the last 10 minutes
    const { data: usersData, error: listError } = await admin.auth.admin.listUsers();
    if (listError || !usersData?.users) {
      console.error('Failed to query users for welcome email verification:', listError);
      return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
    }

    const targetUser = usersData.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Target email is not a registered user' },
        { status: 403 }
      );
    }

    // Check account creation timestamp (must be within last 10 minutes = 600,000 ms)
    const createdAtMs = new Date(targetUser.created_at).getTime();
    const ageMs = Date.now() - createdAtMs;
    const TEN_MINUTES_MS = 10 * 60 * 1000;

    if (ageMs > TEN_MINUTES_MS) {
      return NextResponse.json(
        { error: 'Welcome email window has expired' },
        { status: 403 }
      );
    }

    // Idempotency check: Ensure welcome email is only sent once per user
    if (sentWelcomeUserIds.has(targetUser.id) || targetUser.user_metadata?.welcome_email_sent) {
      return NextResponse.json({
        success: true,
        message: 'Welcome email already sent',
      });
    }

    const result = await sendWelcomeEmail(email, username);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    // Mark as sent
    sentWelcomeUserIds.add(targetUser.id);
    await admin.auth.admin.updateUserById(targetUser.id, {
      user_metadata: { ...targetUser.user_metadata, welcome_email_sent: true },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('Error in send-welcome API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
