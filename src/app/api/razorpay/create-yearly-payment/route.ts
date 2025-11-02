import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

let razorpay: Razorpay | null = null;

function getRazorpayClient(): Razorpay {
  if (!razorpay) {
    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay configuration is missing');
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
    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: 'Payment service is not configured' },
        { status: 503 }
      );
    }

    const { amount, planName, userId, userEmail, userName } = await req.json();

    if (!amount || !planName || !userId || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = getRazorpayClient();

    // Create one-time payment order
    // Generate short receipt ID (max 40 chars)
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits
    const userIdShort = userId.slice(-8); // Last 8 chars of user ID
    const planCode = planName === 'Master' ? 'M' : 'W'; // M for Master, W for Warrior
    const receipt = `Y${planCode}${userIdShort}${timestamp}`; // Format: Y + plan + userID + timestamp
    
    console.log('Creating yearly payment order:', { amount, planName, receipt });
    
    const order = await client.orders.create({
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: receipt,
      notes: {
        user_id: userId,
        plan_name: planName,
        billing_type: 'yearly',
        created_at: new Date().toISOString(),
      }
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });

  } catch (error: any) {
    console.error('Razorpay yearly payment creation error:', error);
    
    return NextResponse.json(
      { 
        error: error?.error?.description || error?.message || 'Failed to create payment',
        details: error?.error || error
      },
      { status: 500 }
    );
  }
}