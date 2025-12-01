import { NextRequest, NextResponse } from 'next/server';
import { sendSubscriptionConfirmationEmail } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const { email, username, planName, features, nextBillingDate, amount } = await request.json();

    if (!email || !username || !planName || !features || !nextBillingDate || !amount) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const result = await sendSubscriptionConfirmationEmail(
      email,
      username,
      planName,
      features,
      nextBillingDate,
      amount
    );

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
    console.error('Error in send-subscription-confirmation API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
