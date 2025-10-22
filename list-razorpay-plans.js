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

async function listPlans() {
  console.log('🔍 Listing all Razorpay plans in your account...');
  console.log('');
  
  try {
    const plans = await razorpay.plans.all();
    
    if (plans.items.length === 0) {
      console.log('❌ No plans found in your Razorpay account.');
      console.log('');
      console.log('You need to create plans first:');
      console.log('1. Go to Razorpay Dashboard → Subscriptions → Plans');
      console.log('2. Create a Master plan ($6.99/month)');
      console.log('3. Create a Warrior plan ($9.99/month)');
      return;
    }
    
    console.log(`✅ Found ${plans.items.length} plan(s):`);
    console.log('');
    
    plans.items.forEach((plan, index) => {
      console.log(`${index + 1}. Plan ID: ${plan.id}`);
      console.log(`   Amount: ${plan.item.amount / 100} ${plan.item.currency}`);
      console.log(`   Interval: ${plan.period} ${plan.interval}`);
      console.log(`   Name: ${plan.item.name || 'No name'}`);
      console.log(`   Status: ${plan.item.active ? 'Active' : 'Inactive'}`);
      console.log('');
    });
    
    console.log('📝 Update your pricing page with these plan IDs:');
    console.log('');
    plans.items.forEach((plan, index) => {
      const amount = plan.item.amount / 100;
      const planName = amount === 6.99 ? 'Master' : amount === 9.99 ? 'Warrior' : `Plan ${index + 1}`;
      console.log(`${planName}: '${plan.id}',`);
    });
    
  } catch (error) {
    console.log('❌ Failed to list plans:', error.message);
    console.log('   Error details:', error.error || error);
  }
}

listPlans().catch(console.error);