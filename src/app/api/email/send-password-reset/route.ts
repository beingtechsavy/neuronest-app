import { NextRequest, NextResponse } from 'next/server';
import { sendPasswordResetEmail } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const { email, username, resetLink } = await request.json();

    if (!email || !username || !resetLink) {
      return NextResponse.json(
        { error: 'Email, username, and resetLink are required' },
        { status: 400 }
      );
    }

    const result = await sendPasswordResetEmail(email, username, resetLink);

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
    console.error('Error in send-password-reset API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
