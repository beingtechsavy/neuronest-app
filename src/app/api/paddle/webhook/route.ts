import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('paddle-signature');

    if (!signature) {
      console.error('Missing Paddle signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify Paddle webhook signature
    const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET!;
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('Invalid Paddle webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);
    console.log('Paddle webhook received:', event.alert_name);

    // Handle different Paddle webhook events
    switch (event.alert_name) {
      case 'subscription_created':
        await handleSubscriptionCreated(event);
        break;
      
      case 'subscription_updated':
        await handleSubscriptionUpdated(event);
        break;
      
      case 'subscription_cancelled':
        await handleSubscriptionCancelled(event);
        break;
      
      case 'subscription_payment_succeeded':
        await handlePaymentSucceeded(event);
        break;
      
      case 'subscription_payment_failed':
        await handlePaymentFailed(event);
        break;
      
      default:
        console.log('Unhandled Paddle webhook event:', event.alert_name);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Paddle webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionCreated(event: any) {
  console.log('Processing subscription created:', event.subscription_id);
  
  const userId = event.passthrough; // User ID passed during checkout
  
  if (!userId) {
    console.error('No user ID found in Paddle webhook data');
    return;
  }

  // Determine plan type based on product ID
  const productId = event.subscription_plan_id;
  let planType = 'master'; // default
  
  if (productId === process.env.NEXT_PUBLIC_PADDLE_WARRIOR_PRODUCT_ID) {
    planType = 'warrior';
  }

  // Save subscription to database
  const { error } = await supabase.from('subscriptions').upsert({
    user_id: userId,
    paddle_subscription_id: event.subscription_id,
    paddle_customer_id: event.user_id,
    plan_type: planType,
    status: 'active',
    current_period_start: new Date(event.next_bill_date).toISOString(),
    current_period_end: new Date(event.next_bill_date).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error('Database error:', error);
  } else {
    console.log('Subscription saved successfully');
  }
}

async function handleSubscriptionUpdated(event: any) {
  console.log('Processing subscription updated:', event.subscription_id);
  
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: event.status,
      current_period_end: new Date(event.next_bill_date).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', event.subscription_id);

  if (error) {
    console.error('Database update error:', error);
  }
}

async function handleSubscriptionCancelled(event: any) {
  console.log('Processing subscription cancelled:', event.subscription_id);
  
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', event.subscription_id);

  if (error) {
    console.error('Database update error:', error);
  }
}

async function handlePaymentSucceeded(event: any) {
  console.log('Processing payment succeeded:', event.subscription_id);
  
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      last_payment_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', event.subscription_id);

  if (error) {
    console.error('Database update error:', error);
  }
}

async function handlePaymentFailed(event: any) {
  console.log('Processing payment failed:', event.subscription_id);
  
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('paddle_subscription_id', event.subscription_id);

  if (error) {
    console.error('Database update error:', error);
  }
}