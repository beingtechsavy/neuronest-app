#!/usr/bin/env node

const http = require('http');

console.log('🧪 Testing Subscription Activation API');
console.log('');

const testData = {
  subscriptionId: 'sub_test_activation_123',
  paymentId: 'pay_test_activation_123',
  signature: 'test_signature_123',
  planName: 'Warrior',
  userId: 'test-user-activation-123'
};

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
          resolve({ status: res.statusCode, data: response });
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function testActivation() {
  console.log('🔄 Testing subscription activation...');
  console.log('   Subscription ID:', testData.subscriptionId);
  console.log('   Plan:', testData.planName);
  console.log('   User ID:', testData.userId);
  console.log('');
  
  try {
    const response = await makeRequest('/api/razorpay/update-subscription', 'POST', testData);
    
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Data:', response.data);
    console.log('');
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Subscription activation is working!');
      console.log('   Message:', response.data.message);
      console.log('   Subscription:', response.data.subscription?.id || 'Created');
    } else {
      console.log('❌ Subscription activation failed');
      console.log('   Error:', response.data.error || 'Unknown error');
    }
    
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }
}

async function runTest() {
  console.log('🚀 Subscription Activation Test');
  console.log('=' .repeat(40));
  
  await testActivation();
  
  console.log('');
  console.log('💡 Next steps:');
  console.log('1. If this test passes, your subscription activation is working');
  console.log('2. If it fails, check the database migration was run correctly');
  console.log('3. Test the full payment flow again');
}

runTest().catch(console.error);