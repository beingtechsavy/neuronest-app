import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Lazy initialization of Supabase client
let supabase: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabase) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration is missing. Please check your environment variables.');
    }
    
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return supabase;
}

export async function POST(req: NextRequest) {
  try {
    // Check if required services are configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Database service is not configured' },
        { status: 503 }
      );
    }

    const {
      subscriptionId,
      paymentId,
      signature,
      planName,
      userId
    } = await req.json();

    if (!subscriptionId || !userId || !planName) {
      return NextResponse.json(
        { error: 'Missing required subscription data' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // Create or update subscription record
    const subscriptionData = {
      user_id: userId,
      plan_type: planName.toLowerCase(),
      status: 'active',
      razorpay_subscription_id: subscriptionId,
      razorpay_payment_id: paymentId,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Upsert subscription (create or update)
    const { data: subscription, error: subscriptionError } = await client
      .from('subscriptions')
      .upsert(subscriptionData, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (subscriptionError) {
      console.error('Error creating/updating subscription:', subscriptionError);
      return NextResponse.json(
        { error: 'Failed to create subscription record' },
        { status: 500 }
      );
    }

    // Log the successful subscription
    if (paymentId) {
      await client.from('payment_logs').insert({
        user_id: userId,
        payment_id: paymentId,
        order_id: subscriptionId,
        amount: planName.toLowerCase() === 'master' ? 599 : 899,
        currency: 'INR',
        status: 'success',
        plan_type: planName.toLowerCase(),
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription activated successfully',
      subscription: subscription,
    });

  } catch (error) {
    console.error('Subscription update error:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}