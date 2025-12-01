import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const { email, username } = await request.json();

    if (!email || !username) {
      return NextResponse.json(
        { error: 'Email and username are required' },
        { status: 400 }
      );
    }

    const result = await sendWelcomeEmail(email, username);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

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
