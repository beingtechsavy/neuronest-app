import { NextRequest, NextResponse } from 'next/server';
import { sendPaymentReceiptEmail } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const { email, username, planName, amount, transactionId, date } = await request.json();

    if (!email || !username || !planName || !amount || !transactionId || !date) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const result = await sendPaymentReceiptEmail(
      email,
      username,
      planName,
      amount,
      transactionId,
      date
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
    console.error('Error in send-payment-receipt API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
