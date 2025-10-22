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

    const { planId, userId, userEmail, userName } = await req.json();

    if (!planId || !userId || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: planId, userId, userEmail' },
        { status: 400 }
      );
    }

    const client = getRazorpayClient();

    // Create or get customer
    let customer;
    try {
      // Try to create a new customer
      customer = await client.customers.create({
        name: userName || userEmail.split('@')[0],
        email: userEmail,
        contact: '', // Optional phone number
        notes: {
          user_id: userId,
          created_via: 'neuronest_app'
        }
      });
    } catch (error: any) {
      // If customer already exists, we'll handle it in subscription creation
      console.log('Customer creation note:', error.message);
    }

    // Create subscription
    const subscriptionData: any = {
      plan_id: planId,
      customer_notify: 1,
      quantity: 1,
      total_count: 12, // 12 months (1 year subscription)
      notes: {
        user_id: userId,
        plan_name: planId === 'plan_RWeRVyGgnaoYsF' ? 'Master' : 'Warrior',
        created_at: new Date().toISOString(),
      }
    };

    // Add customer ID if we created one
    if (customer) {
      subscriptionData.customer_id = customer.id;
    }

    const subscription = await client.subscriptions.create(subscriptionData);

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      customerId: customer?.id || null,
      shortUrl: subscription.short_url,
      status: subscription.status,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });

  } catch (error: any) {
    console.error('Razorpay subscription creation error:', error);
    
    // Return specific error message for debugging
    const errorMessage = error?.error?.description || error?.message || 'Failed to create subscription';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error?.error || error
      },
      { status: 500 }
    );
  }
}