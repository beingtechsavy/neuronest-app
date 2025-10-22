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
    // Generate short receipt ID (max 40 chars)
    const shortUserId = userId.substring(0, 8);
    const timestamp = Date.now().toString().slice(-8);
    const receipt = `rcpt_${shortUserId}_${timestamp}`;
    
    const order = await client.orders.create({
      amount: Math.round(amount * 100), // Convert to paise (smallest currency unit)
      currency: currency,
      receipt: receipt, // Keep under 40 characters
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

  } catch (error: any) {
    console.error('Razorpay order creation error:', error);
    
    // Return specific error message for debugging
    const errorMessage = error?.error?.description || error?.message || 'Failed to create payment order';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error?.error || error
      },
      { status: 500 }
    );
  }
}