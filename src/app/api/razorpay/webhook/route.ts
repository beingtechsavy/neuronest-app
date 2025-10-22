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

    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      console.error('Missing Razorpay signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify Razorpay webhook signature (if webhook secret is configured)
    if (process.env.RAZORPAY_WEBHOOK_SECRET) {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(body)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('Invalid Razorpay webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    }

    const event = JSON.parse(body);
    console.log('Razorpay webhook event:', event.event);

    const client = getSupabaseClient();

    // Handle different webhook events
    switch (event.event) {
      case 'payment.captured':
        await handlePaymentCaptured(event.payload.payment.entity, client);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity, client);
        break;
      
      case 'subscription.activated':
        await handleSubscriptionActivated(event.payload.subscription.entity, client);
        break;
      
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(event.payload.subscription.entity, client);
        break;
      
      case 'subscription.charged':
        await handleSubscriptionCharged(event.payload.subscription.entity, event.payload.payment.entity, client);
        break;
      
      case 'subscription.completed':
        await handleSubscriptionCompleted(event.payload.subscription.entity, client);
        break;
      
      default:
        console.log('Unhandled Razorpay webhook event:', event.event);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Razorpay webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentCaptured(payment: any, client: any) {
  console.log('Processing payment captured:', payment.id);
  
  try {
    // Update payment log
    await client.from('payment_logs').upsert({
      payment_id: payment.id,
      order_id: payment.order_id,
      amount: payment.amount / 100, // Convert from paise to rupees
      currency: payment.currency,
      status: 'captured',
      updated_at: new Date().toISOString(),
    });

    // If this is a subscription payment, update subscription status
    if (payment.notes && payment.notes.user_id) {
      await client
        .from('subscriptions')
        .update({
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', payment.notes.user_id);
    }
  } catch (error) {
    console.error('Error handling payment captured:', error);
  }
}

async function handlePaymentFailed(payment: any, client: any) {
  console.log('Processing payment failed:', payment.id);
  
  try {
    // Update payment log
    await client.from('payment_logs').upsert({
      payment_id: payment.id,
      order_id: payment.order_id,
      amount: payment.amount / 100,
      currency: payment.currency,
      status: 'failed',
      error_description: payment.error_description,
      updated_at: new Date().toISOString(),
    });

    // If this is a subscription payment, update subscription status
    if (payment.notes && payment.notes.user_id) {
      await client
        .from('subscriptions')
        .update({
          status: 'payment_failed',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', payment.notes.user_id);
    }
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

async function handleSubscriptionActivated(subscription: any, client: any) {
  console.log('Processing subscription activated:', subscription.id);
  
  try {
    // Update subscription status
    await client
      .from('subscriptions')
      .update({
        status: 'active',
        razorpay_subscription_id: subscription.id,
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_subscription_id', subscription.id);
  } catch (error) {
    console.error('Error handling subscription activated:', error);
  }
}

async function handleSubscriptionCancelled(subscription: any, client: any) {
  console.log('Processing subscription cancelled:', subscription.id);
  
  try {
    // Update subscription status
    await client
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_subscription_id', subscription.id);
  } catch (error) {
    console.error('Error handling subscription cancelled:', error);
  }
}

async function handleSubscriptionCharged(subscription: any, payment: any, client: any) {
  console.log('Processing subscription charged:', subscription.id, 'Payment:', payment.id);
  
  try {
    // Log the payment
    await client.from('payment_logs').insert({
      payment_id: payment.id,
      order_id: subscription.id,
      amount: payment.amount / 100, // Convert from paise
      currency: payment.currency,
      status: 'success',
      plan_type: subscription.notes?.plan_name?.toLowerCase() || 'unknown',
      created_at: new Date().toISOString(),
    });

    // Update subscription period
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1); // Add 1 month

    await client
      .from('subscriptions')
      .update({
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: currentPeriodEnd.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_subscription_id', subscription.id);
  } catch (error) {
    console.error('Error handling subscription charged:', error);
  }
}

async function handleSubscriptionCompleted(subscription: any, client: any) {
  console.log('Processing subscription completed:', subscription.id);
  
  try {
    // Update subscription status to completed
    await client
      .from('subscriptions')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_subscription_id', subscription.id);
  } catch (error) {
    console.error('Error handling subscription completed:', error);
  }
}