import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { sendSubscriptionConfirmationEmail, sendPaymentReceiptEmail } from '@/lib/email-service';

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
    // CRITICAL: Webhook secret must be configured
    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      console.error('RAZORPAY_WEBHOOK_SECRET not configured - webhook rejected');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 503 }
      );
    }

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

    // ALWAYS verify webhook signature - CRITICAL SECURITY CHECK
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('Invalid Razorpay webhook signature - potential fraud attempt');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    console.log('Razorpay webhook event:', event.event);

    const client = getSupabaseClient();

    // Log webhook event for audit trail and idempotency
    const eventId = event.payload?.payment?.entity?.id || event.payload?.subscription?.entity?.id || `event_${Date.now()}`;
    
    // Check for duplicate webhook (idempotency)
    const { data: existingLog } = await client
      .from('webhook_logs')
      .select('id')
      .eq('event_id', eventId)
      .eq('event_type', event.event)
      .single();

    if (existingLog) {
      console.log('Duplicate webhook detected, skipping:', eventId);
      return NextResponse.json({ success: true, message: 'Duplicate event ignored' });
    }

    // Log the webhook event
    try {
      await client.from('webhook_logs').insert({
        event_id: eventId,
        event_type: event.event,
        payload: event,
        signature: signature,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to log webhook:', err);
    }

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
    
    // Get user details for email
    const { data: subData } = await client
      .from('subscriptions')
      .select('user_id, plan_type')
      .eq('razorpay_subscription_id', subscription.id)
      .single();
    
    if (subData) {
      const { data: userData } = await client.auth.admin.getUserById(subData.user_id);
      
      if (userData?.user?.email) {
        const planName = subData.plan_type === 'master' ? 'Master Plan' : 'Warrior Plan';
        const features = subData.plan_type === 'master' 
          ? ['Unlimited AI Breakdowns', 'Priority Support', 'Advanced Analytics']
          : ['Unlimited AI Breakdowns', 'All Premium Features', 'Priority Support', 'Advanced Analytics', 'Custom Integrations'];
        
        const nextBillingDate = new Date();
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        
        const amount = subData.plan_type === 'master' ? '₹99/month' : '₹199/month';
        
        // Send subscription confirmation email
        await sendSubscriptionConfirmationEmail(
          userData.user.email,
          userData.user.email.split('@')[0],
          planName,
          features,
          nextBillingDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
          amount
        ).catch(err => console.error('Failed to send subscription email:', err));
      }
    }
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
    
    // Get user details for receipt email
    const { data: subData } = await client
      .from('subscriptions')
      .select('user_id, plan_type')
      .eq('razorpay_subscription_id', subscription.id)
      .single();
    
    if (subData) {
      const { data: userData } = await client.auth.admin.getUserById(subData.user_id);
      
      if (userData?.user?.email) {
        const planName = subData.plan_type === 'master' ? 'Master Plan' : 'Warrior Plan';
        const amount = `₹${(payment.amount / 100).toFixed(2)}`;
        
        // Send payment receipt email
        await sendPaymentReceiptEmail(
          userData.user.email,
          userData.user.email.split('@')[0],
          planName,
          amount,
          payment.id,
          new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
        ).catch(err => console.error('Failed to send receipt email:', err));
      }
    }
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