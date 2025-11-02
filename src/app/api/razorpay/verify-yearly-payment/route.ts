import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { 
      orderId, 
      paymentId, 
      signature, 
      planName, 
      userId 
    } = await req.json();

    if (!orderId || !paymentId || !signature || !planName || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify payment signature
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== signature) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Calculate expiration date (1 year from now)
    const expirationDate = new Date();
    expirationDate.setFullYear(expirationDate.getFullYear() + 1);

    // Update user's subscription status
    const { error: updateError } = await supabase
      .from('usage_limits')
      .upsert({
        user_id: userId,
        plan_type: planName.toLowerCase(),
        yearly_payment_id: paymentId,
        yearly_expires_at: expirationDate.toISOString(),
        breakdowns_limit: planName === 'Master' ? 10 : 25,
        flashcards_limit: planName === 'Master' ? 20 : 50,
        subjects_limit: planName === 'Master' ? 15 : 999,
        updated_at: new Date().toISOString(),
      });

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update subscription status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Yearly subscription activated successfully',
      expiresAt: expirationDate.toISOString(),
    });

  } catch (error: any) {
    console.error('Yearly payment verification error:', error);
    
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to verify payment',
      },
      { status: 500 }
    );
  }
}