#!/usr/bin/env node

const Razorpay = require('razorpay');

// Live keys from .env.local
const RAZORPAY_KEY_ID = 'rzp_live_RWePW0dvQw01lH';
const RAZORPAY_KEY_SECRET = '9LLkAUW1GIRSCzNqyfRz8FLc';

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

async function createLivePlans() {
  console.log('🚀 Creating LIVE Razorpay Plans for NeuroNest');
  console.log('💰 Using LIVE keys - Real money transactions!');
  console.log('');
  
  try {
    // Master Plan - ₹599/month
    console.log('🔄 Creating LIVE Master Plan (₹599/month)...');
    const masterPlan = await razorpay.plans.create({
      period: 'monthly',
      interval: 1,
      item: {
        name: 'NeuroNest Master Plan',
        amount: 59900, // ₹599 in paise
        currency: 'INR',
        description: 'Perfect for regular students - 15 subjects, 10 AI breakdowns per day, 20 AI flashcards per day'
      },
      notes: {
        plan_type: 'master',
        features: '15 subjects, 10 AI breakdowns, 20 flashcards, AI study buddy, Full analytics, Priority support'
      }
    });
    
    console.log('✅ LIVE Master Plan created!');
    console.log('   Plan ID:', masterPlan.id);
    console.log('   Amount: ₹' + (masterPlan.item.amount / 100));
    console.log('');
    
    // Warrior Plan - ₹899/month
    console.log('🔄 Creating LIVE Warrior Plan (₹899/month)...');
    const warriorPlan = await razorpay.plans.create({
      period: 'monthly',
      interval: 1,
      item: {
        name: 'NeuroNest Warrior Plan',
        amount: 89900, // ₹899 in paise
        currency: 'INR',
        description: 'For power users and heavy studiers - Unlimited subjects, 25 AI breakdowns per day, 50 AI flashcards per day'
      },
      notes: {
        plan_type: 'warrior',
        features: 'Unlimited subjects, 25 AI breakdowns, 50 flashcards, Advanced AI features, Predictive analytics, API access'
      }
    });
    
    console.log('✅ LIVE Warrior Plan created!');
    console.log('   Plan ID:', warriorPlan.id);
    console.log('   Amount: ₹' + (warriorPlan.item.amount / 100));
    console.log('');
    
    // Summary
    console.log('🎉 LIVE PLANS CREATED SUCCESSFULLY!');
    console.log('💰 Ready for real payments!');
    console.log('');
    console.log('📝 UPDATE YOUR CODE WITH THESE LIVE PLAN IDs:');
    console.log('');
    console.log(`Master Plan: "${masterPlan.id}"`);
    console.log(`Warrior Plan: "${warriorPlan.id}"`);
    console.log('');
    
    return { masterPlan, warriorPlan };
    
  } catch (error) {
    console.log('❌ Failed to create LIVE plans:', error.message);
    console.log('   Error details:', error.error || error);
    
    if (error.error && error.error.code === 'BAD_REQUEST_ERROR') {
      console.log('');
      console.log('💡 Possible issues:');
      console.log('   - Live keys might not be activated');
      console.log('   - Account might need verification');
      console.log('   - Check Razorpay dashboard for account status');
    }
    
    return null;
  }
}

createLivePlans().catch(console.error);