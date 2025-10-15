import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

// Lazy initialization of Razorpay client
let razorpay: Razorpay | null = null;

function getRazorpayClient(): Razorpay {
  if (!razorpay) {
    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay configuration is missing. Please check your environment variables.');
    }
    
    razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpay;
}

export async function POST(req: NextRequest) {
  try {
    // Check if Razorpay is configured
    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: 'Payment service is not configured' },
        { status: 503 }
      );
    }

    const { amount, currency = 'USD', planName, userId } = await req.json();

    if (!amount || !planName || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, planName, userId' },
        { status: 400 }
      );
    }

    const client = getRazorpayClient();

    // Create Razorpay order
    const order = await client.orders.create({
      amount: Math.round(amount * 100), // Convert to paise (smallest currency unit)
      currency: currency,
      receipt: `receipt_${userId}_${Date.now()}`,
      notes: {
        plan: planName,
        user_id: userId,
        created_at: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });

  } catch (error) {
    console.error('Razorpay order creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    );
  }
}