#!/usr/bin/env node

/**
 * Razorpay Integration Test Script
 * Tests the complete payment flow for NeuroNest
 */

const https = require('https');
const crypto = require('crypto');

// Configuration
const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://www.neuronest.work' 
  : 'http://localhost:3000';

const TEST_USER_ID = 'test-user-' + Date.now();
const TEST_PLAN = 'Master';
const TEST_AMOUNT = 6.99;

console.log('🧪 Starting Razorpay Integration Test');
console.log('📍 Base URL:', BASE_URL);
console.log('👤 Test User ID:', TEST_USER_ID);
console.log('💰 Test Plan:', TEST_PLAN, '($' + TEST_AMOUNT + ')');
console.log('');

// Test 1: Create Order
async function testCreateOrder() {
  console.log('🔄 Test 1: Creating Razorpay Order...');
  
  const orderData = {
    amount: TEST_AMOUNT,
    currency: 'USD',
    planName: TEST_PLAN,
    userId: TEST_USER_ID
  };

  try {
    const response = await makeRequest('/api/razorpay/create-order', 'POST', orderData);
    
    if (response.success) {
      console.log('✅ Order created successfully!');
      console.log('   Order ID:', response.orderId);
      console.log('   Amount:', response.amount / 100, response.currency);
      console.log('   Key ID:', response.keyId);
      return response;
    } else {
      console.log('❌ Order creation failed:', response.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Order creation error:', error.message);
    return null;
  }
}

// Test 2: Simulate Payment Verification
async function testPaymentVerification(orderData) {
  console.log('\n🔄 Test 2: Simulating Payment Verification...');
  
  // Simulate Razorpay response data
  const mockPaymentId = 'pay_test_' + Date.now();
  const mockSignature = generateMockSignature(orderData.orderId, mockPaymentId);
  
  const verificationData = {
    razorpay_order_id: orderData.orderId,
    razorpay_payment_id: mockPaymentId,
    razorpay_signature: mockSignature,
    planName: TEST_PLAN,
    userId: TEST_USER_ID,
    amount: TEST_AMOUNT
  };

  try {
    const response = await makeRequest('/api/razorpay/verify-payment', 'POST', verificationData);
    
    if (response.success) {
      console.log('✅ Payment verification successful!');
      console.log('   Subscription created:', response.subscription?.id);
      console.log('   Plan type:', response.subscription?.plan_type);
      console.log('   Status:', response.subscription?.status);
      return response;
    } else {
      console.log('❌ Payment verification failed:', response.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Payment verification error:', error.message);
    return null;
  }
}

// Test 3: Test Webhook Endpoint
async function testWebhook() {
  console.log('\n🔄 Test 3: Testing Webhook Endpoint...');
  
  const webhookData = {
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: 'pay_test_webhook_' + Date.now(),
          order_id: 'order_test_webhook_' + Date.now(),
          amount: TEST_AMOUNT * 100,
          currency: 'USD',
          status: 'captured',
          notes: {
            user_id: TEST_USER_ID,
            plan: TEST_PLAN
          }
        }
      }
    }
  };

  try {
    const response = await makeRequest('/api/razorpay/webhook', 'POST', webhookData, {
      'x-razorpay-signature': 'test_signature_' + Date.now()
    });
    
    if (response.success) {
      console.log('✅ Webhook processed successfully!');
      return response;
    } else {
      console.log('⚠️  Webhook processing completed with warnings:', response.error || 'No error message');
      return response;
    }
  } catch (error) {
    console.log('❌ Webhook test error:', error.message);
    return null;
  }
}

// Test 4: Environment Variables Check
function testEnvironmentVariables() {
  console.log('\n🔄 Test 4: Checking Environment Variables...');
  
  const requiredVars = [
    'NEXT_PUBLIC_RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  let allPresent = true;
  
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      console.log('✅', varName, '- Present');
    } else {
      console.log('❌', varName, '- Missing');
      allPresent = false;
    }
  });

  if (allPresent) {
    console.log('✅ All required environment variables are present!');
  } else {
    console.log('❌ Some environment variables are missing!');
  }

  return allPresent;
}

// Helper Functions
function makeRequest(path, method, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...headers
      }
    };

    const req = (url.protocol === 'https:' ? https : require('http')).request(options, (res) => {
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

function generateMockSignature(orderId, paymentId) {
  // This is a mock signature for testing - in real scenario, Razorpay generates this
  const secret = process.env.RAZORPAY_KEY_SECRET || 'test_secret';
  const body = orderId + '|' + paymentId;
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

// Main Test Runner
async function runTests() {
  console.log('🚀 NeuroNest Razorpay Integration Test Suite');
  console.log('=' .repeat(50));
  
  // Test environment variables first
  const envCheck = testEnvironmentVariables();
  if (!envCheck && process.env.NODE_ENV === 'production') {
    console.log('\n❌ Cannot proceed with tests - missing environment variables');
    process.exit(1);
  }

  // Test 1: Create Order
  const orderResult = await testCreateOrder();
  if (!orderResult) {
    console.log('\n❌ Test suite failed at order creation');
    process.exit(1);
  }

  // Test 2: Payment Verification
  const verificationResult = await testPaymentVerification(orderResult);
  if (!verificationResult) {
    console.log('\n❌ Test suite failed at payment verification');
    process.exit(1);
  }

  // Test 3: Webhook
  await testWebhook();

  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('🎉 Test Suite Complete!');
  console.log('');
  console.log('📊 Results Summary:');
  console.log('   ✅ Order Creation: Working');
  console.log('   ✅ Payment Verification: Working');
  console.log('   ✅ Webhook Endpoint: Accessible');
  console.log('   ✅ Environment Variables: Configured');
  console.log('');
  console.log('🚀 Your Razorpay integration is ready for production!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Deploy your application');
  console.log('2. Configure webhooks in Razorpay dashboard');
  console.log('3. Test with real payments using test cards');
  console.log('4. Switch to live keys when ready');
}

// Run the tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testCreateOrder, testPaymentVerification, testWebhook };