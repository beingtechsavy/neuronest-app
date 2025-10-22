#!/usr/bin/env node

/**
 * Simple Razorpay Payment Test
 * Tests the payment flow with localhost
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001';
const TEST_USER_ID = 'test-user-' + Date.now();

console.log('🧪 Testing Razorpay Payment Integration');
console.log('📍 Server:', BASE_URL);
console.log('👤 Test User:', TEST_USER_ID);
console.log('');

async function testCreateOrder() {
  console.log('🔄 Testing Order Creation...');
  
  const orderData = {
    amount: 6.99,
    currency: 'USD',
    planName: 'Master',
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
      console.log('   Details:', response.details);
      return null;
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
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

async function runTest() {
  const result = await testCreateOrder();
  
  if (result) {
    console.log('\n🎉 Payment system is working!');
    console.log('\nNext steps:');
    console.log('1. Run the database migration in Supabase');
    console.log('2. Test the complete payment flow on the website');
    console.log('3. Configure webhooks in Razorpay dashboard');
  } else {
    console.log('\n❌ Payment system needs attention');
  }
}

runTest().catch(console.error);