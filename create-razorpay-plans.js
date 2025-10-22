#!/usr/bin/env node

const Razorpay = require('razorpay');
const fs = require('fs');

// Read environment variables from .env.local
let RAZORPAY_KEY_ID = '';
let RAZORPAY_KEY_SECRET = '';

try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const lines = envContent.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('NEXT_PUBLIC_RAZORPAY_KEY_ID=')) {
      RAZORPAY_KEY_ID = line.split('=')[1].trim();
    }
    if (line.startsWith('RAZORPAY_KEY_SECRET=')) {
      RAZORPAY_KEY_SECRET = line.split('=')[1].trim();
    }
  }
} catch (error) {
  console.log('❌ Could not read .env.local file:', error.message);
  process.exit(1);
}

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

async function createPlans() {
  console.log('🚀 Creating Razorpay Subscription Plans for NeuroNest');
  console.log('');
  
  // Master Plan - ₹599/month (approximately $7.20)
  console.log('🔄 Creating Master Plan (₹599/month)...');
  try {
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
    
    console.log('✅ Master Plan created successfully!');
    console.log('   Plan ID:', masterPlan.id);
    console.log('   Amount: ₹' + (masterPlan.item.amount / 100), masterPlan.item.currency);
    console.log('');
    
    // Warrior Plan - ₹899/month (approximately $10.80)
    console.log('🔄 Creating Warrior Plan (₹899/month)...');
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
    
    console.log('✅ Warrior Plan created successfully!');
    console.log('   Plan ID:', warriorPlan.id);
    console.log('   Amount: ₹' + (warriorPlan.item.amount / 100), warriorPlan.item.currency);
    console.log('');
    
    // Summary
    console.log('🎉 Both plans created successfully!');
    console.log('');
    console.log('📝 Update your pricing page with these plan IDs:');
    console.log('');
    console.log('const plans = [');
    console.log('  {');
    console.log('    name: "Master",');
    console.log('    price: 599, // INR');
    console.log(`    razorpayPlanId: "${masterPlan.id}",`);
    console.log('  },');
    console.log('  {');
    console.log('    name: "Warrior",');
    console.log('    price: 899, // INR');
    console.log(`    razorpayPlanId: "${warriorPlan.id}",`);
    console.log('  }');
    console.log('];');
    console.log('');
    console.log('🔧 Next steps:');
    console.log('1. Update your pricing page with the new plan IDs above');
    console.log('2. Test the subscription flow');
    console.log('3. Configure webhooks in Razorpay dashboard');
    
    return { masterPlan, warriorPlan };
    
  } catch (error) {
    console.log('❌ Failed to create plans:', error.message);
    console.log('   Error details:', error.error || error);
    
    if (error.error && error.error.code === 'BAD_REQUEST_ERROR') {
      console.log('');
      console.log('💡 Common issues:');
      console.log('   - Make sure you are using the correct API keys');
      console.log('   - Check if your Razorpay account supports subscriptions');
      console.log('   - Verify your account is activated for live transactions');
    }
    
    return null;
  }
}

createPlans().catch(console.error);