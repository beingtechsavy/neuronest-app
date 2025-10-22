#!/usr/bin/env node

/**
 * Direct Razorpay API Test
 * Tests subscription creation directly with Razorpay API
 */

const Razorpay = require('razorpay');
const fs = require('fs');

console.log('🧪 Testing Direct Razorpay Subscription Creation');
console.log('');

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

// Check environment variables
console.log('🔧 Environment Check:');
console.log('   NEXT_PUBLIC_RAZORPAY_KEY_ID:', RAZORPAY_KEY_ID ? '✅ Present' : '❌ Missing');
console.log('   RAZORPAY_KEY_SECRET:', RAZORPAY_KEY_SECRET ? '✅ Present' : '❌ Missing');
console.log('');

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.log('❌ Missing Razorpay credentials. Please check your .env.local file.');
  process.exit(1);
}

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

async function testCreateCustomer() {
  console.log('🔄 Testing Customer Creation...');
  
  try {
    const customer = await razorpay.customers.create({
      name: 'Test User',
      email: 'test@neuronest.work',
      contact: '',
      notes: {
        user_id: 'test-user-123',
        created_via: 'neuronest_app'
      }
    });
    
    console.log('✅ Customer created successfully!');
    console.log('   Customer ID:', customer.id);
    console.log('   Email:', customer.email);
    return customer;
  } catch (error) {
    console.log('❌ Customer creation failed:', error.message);
    console.log('   Error details:', error.error || error);
    return null;
  }
}

async function testCreateSubscription(customerId = null) {
  console.log('\n🔄 Testing Subscription Creation...');
  
  const subscriptionData = {
    plan_id: 'plan_RWe1iCbZxLPKGa', // Master plan (new ID)
    customer_notify: 1,
    quantity: 1,
    total_count: 12, // 12 months (1 year)
    notes: {
      user_id: 'test-user-123',
      plan_name: 'Master',
      created_at: new Date().toISOString(),
    }
  };

  if (customerId) {
    subscriptionData.customer_id = customerId;
  }

  try {
    const subscription = await razorpay.subscriptions.create(subscriptionData);
    
    console.log('✅ Subscription created successfully!');
    console.log('   Subscription ID:', subscription.id);
    console.log('   Status:', subscription.status);
    console.log('   Plan ID:', subscription.plan_id);
    console.log('   Short URL:', subscription.short_url);
    return subscription;
  } catch (error) {
    console.log('❌ Subscription creation failed:', error.message);
    console.log('   Error details:', error.error || error);
    return null;
  }
}

async function testGetPlan(planId) {
  console.log(`\n🔄 Testing Plan Retrieval (${planId})...`);
  
  try {
    const plan = await razorpay.plans.fetch(planId);
    
    console.log('✅ Plan retrieved successfully!');
    console.log('   Plan ID:', plan.id);
    console.log('   Amount:', plan.item.amount / 100, plan.item.currency);
    console.log('   Interval:', plan.period, plan.interval);
    console.log('   Status:', plan.item.active ? 'Active' : 'Inactive');
    return plan;
  } catch (error) {
    console.log('❌ Plan retrieval failed:', error.message);
    console.log('   Error details:', error.error || error);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Direct Razorpay API Test Suite');
  console.log('=' .repeat(50));
  
  // Test 1: Check if plans exist
  const masterPlan = await testGetPlan('plan_RWe1iCbZxLPKGa');
  const warriorPlan = await testGetPlan('plan_RWe1iqY5QCvfYH');
  
  if (!masterPlan || !warriorPlan) {
    console.log('\n❌ One or both plans are not accessible. Check your Razorpay dashboard.');
    return;
  }
  
  // Test 2: Create customer
  const customer = await testCreateCustomer();
  
  // Test 3: Create subscription
  const subscription = await testCreateSubscription(customer?.id);
  
  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 Test Results Summary:');
  console.log('   ✅ Master Plan Access:', masterPlan ? 'Working' : 'Failed');
  console.log('   ✅ Warrior Plan Access:', warriorPlan ? 'Working' : 'Failed');
  console.log('   ✅ Customer Creation:', customer ? 'Working' : 'Failed');
  console.log('   ✅ Subscription Creation:', subscription ? 'Working' : 'Failed');
  
  if (masterPlan && warriorPlan && customer && subscription) {
    console.log('\n🎉 All tests passed! Your Razorpay integration is working.');
    console.log('\nNext steps:');
    console.log('1. Start your development server: npm run dev');
    console.log('2. Test the subscription flow on your website');
    console.log('3. Check the browser console for any frontend errors');
  } else {
    console.log('\n❌ Some tests failed. Check the errors above.');
  }
}

runTests().catch(console.error);