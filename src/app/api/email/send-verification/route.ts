import { NextRequest, NextResponse } from 'next/server';
import { sendVerificationEmail } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const { email, username, verificationLink } = await request.json();

    if (!email || !username || !verificationLink) {
      return NextResponse.json(
        { error: 'Email, username, and verificationLink are required' },
        { status: 400 }
      );
    }

    const result = await sendVerificationEmail(email, username, verificationLink);

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
    console.error('Error in send-verification API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
