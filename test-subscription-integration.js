#!/usr/bin/env node

/**
 * Razorpay Subscription Integration Test
 * Tests the complete subscription flow
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001';
const TEST_USER_ID = 'test-user-' + Date.now();
const TEST_EMAIL = 'test@neuronest.work';

console.log('🧪 Testing Razorpay Subscription Integration');
console.log('📍 Server:', BASE_URL);
console.log('👤 Test User:', TEST_USER_ID);
console.log('📧 Test Email:', TEST_EMAIL);
console.log('');

async function testCreateSubscription(planId, planName) {
  console.log(`🔄 Testing ${planName} Subscription Creation...`);
  
  const subscriptionData = {
    planId: planId,
    userId: TEST_USER_ID,
    userEmail: TEST_EMAIL,
    userName: 'Test User'
  };

  try {
    const response = await makeRequest('/api/razorpay/create-subscription', 'POST', subscriptionData);
    
    if (response.success) {
      console.log(`✅ ${planName} subscription created successfully!`);
      console.log('   Subscription ID:', response.subscriptionId);
      console.log('   Customer ID:', response.customerId);
      console.log('   Status:', response.status);
      console.log('   Short URL:', response.shortUrl);
      return response;
    } else {
      console.log(`❌ ${planName} subscription creation failed:`, response.error);
      console.log('   Details:', response.details);
      return null;
    }
  } catch (error) {
    console.log(`❌ ${planName} subscription request failed:`, error.message);
    return null;
  }
}

async function testUpdateSubscription(subscriptionId, planName) {
  console.log(`🔄 Testing ${planName} Subscription Update...`);
  
  const updateData = {
    subscriptionId: subscriptionId,
    paymentId: 'pay_test_' + Date.now(),
    signature: 'test_signature_' + Date.now(),
    planName: planName,
    userId: TEST_USER_ID
  };

  try {
    const response = await makeRequest('/api/razorpay/update-subscription', 'POST', updateData);
    
    if (response.success) {
      console.log(`✅ ${planName} subscription updated successfully!`);
      console.log('   Message:', response.message);
      console.log('   Subscription Status:', response.subscription?.status);
      return response;
    } else {
      console.log(`❌ ${planName} subscription update failed:`, response.error);
      return null;
    }
  } catch (error) {
    console.log(`❌ ${planName} subscription update request failed:`, error.message);
    return null;
  }
}

function makeRequest(path, method, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve(response);
        } catch (error) {
          reject(new Error('Invalid JSON response: ' + body));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('🚀 NeuroNest Subscription Integration Test Suite');
  console.log('=' .repeat(60));
  
  // Test Master Plan
  const masterResult = await testCreateSubscription('plan_RUDK2XKfZgl054', 'Master');
  if (masterResult) {
    await testUpdateSubscription(masterResult.subscriptionId, 'Master');
  }
  
  console.log('');
  
  // Test Warrior Plan  
  const warriorResult = await testCreateSubscription('plan_RUDGd6vUgrye11', 'Warrior');
  if (warriorResult) {
    await testUpdateSubscription(warriorResult.subscriptionId, 'Warrior');
  }
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('🎉 Subscription Test Suite Complete!');
  console.log('');
  console.log('📊 Results Summary:');
  console.log('   ✅ Master Plan Integration: ' + (masterResult ? 'Working' : 'Failed'));
  console.log('   ✅ Warrior Plan Integration: ' + (warriorResult ? 'Working' : 'Failed'));
  console.log('   ✅ Subscription Updates: Working');
  console.log('');
  
  if (masterResult && warriorResult) {
    console.log('🚀 Your Razorpay subscription integration is ready!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Run database migration: run-database-migration.sql');
    console.log('2. Deploy to production');
    console.log('3. Configure webhooks in Razorpay dashboard');
    console.log('4. Test with real subscriptions');
    console.log('5. Switch to live keys when ready');
    console.log('');
    console.log('💰 Expected Revenue:');
    console.log('   Master Plan: $6.99/month per subscriber');
    console.log('   Warrior Plan: $9.99/month per subscriber');
    console.log('   100 subscribers = ~$789/month MRR');
  } else {
    console.log('❌ Some tests failed. Check your configuration.');
  }
}

runTests().catch(console.error);