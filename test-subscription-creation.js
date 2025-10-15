// Test PayPal subscription creation to debug the "things don't appear to be working" error
const https = require('https');
const fs = require('fs');

// Read credentials
let CLIENT_ID, CLIENT_SECRET, MASTER_PLAN_ID;
try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const lines = envContent.split('\n');
  
  lines.forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_PAYPAL_CLIENT_ID=')) {
      CLIENT_ID = line.split('=')[1];
    }
    if (line.startsWith('PAYPAL_CLIENT_SECRET=')) {
      CLIENT_SECRET = line.split('=')[1];
    }
    if (line.startsWith('NEXT_PUBLIC_PAYPAL_MASTER_PLAN_ID=')) {
      MASTER_PLAN_ID = line.split('=')[1];
    }
  });
} catch (error) {
  console.log('❌ Error reading credentials:', error.message);
  process.exit(1);
}

console.log('🧪 Testing PayPal Subscription Creation');
console.log('======================================');
console.log('Client ID:', CLIENT_ID ? CLIENT_ID.substring(0, 20) + '...' : 'NOT FOUND');
console.log('Master Plan ID:', MASTER_PLAN_ID || 'NOT FOUND');

async function getAccessToken() {
  console.log('\n🔐 Step 1: Getting access token...');
  
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  
  return new Promise((resolve, reject) => {
    const postData = 'grant_type=client_credentials';
    
    const options = {
      hostname: 'api-m.sandbox.paypal.com',
      port: 443,
      path: '/v1/oauth2/token',
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200) {
            console.log('✅ Access token obtained');
            resolve(response.access_token);
          } else {
            console.log('❌ Token request failed:', response);
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(response)}`));
          }
        } catch (error) {
          reject(new Error(`Parse error: ${error.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function createSubscription(accessToken) {
  console.log('\n📋 Step 2: Creating subscription...');
  
  const subscriptionData = {
    plan_id: MASTER_PLAN_ID,
    subscriber: {
      email_address: 'sb-2gyyg46894003@personal.example.com',
    },
    application_context: {
      brand_name: 'NeuroNest',
      locale: 'en-US',
      shipping_preference: 'NO_SHIPPING',
      user_action: 'SUBSCRIBE_NOW',
      payment_method: {
        payer_selected: 'PAYPAL',
        payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
      },
      return_url: 'http://localhost:3000/dashboard?success=true',
      cancel_url: 'http://localhost:3000/pricing?canceled=true',
    },
  };
  
  console.log('Subscription data:', JSON.stringify(subscriptionData, null, 2));
  
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(subscriptionData);
    
    const options = {
      hostname: 'api-m.sandbox.paypal.com',
      port: 443,
      path: '/v1/billing/subscriptions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Prefer': 'return=representation',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('\nSubscription response status:', res.statusCode);
        console.log('Subscription response data:', data);
        
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 201) {
            console.log('✅ Subscription created successfully!');
            
            // Find approval URL
            const approvalUrl = response.links.find(link => link.rel === 'approve')?.href;
            console.log('\n🔗 Approval URL:', approvalUrl);
            
            if (approvalUrl) {
              console.log('\n📝 Next steps:');
              console.log('1. Copy the approval URL above');
              console.log('2. Open it in your browser');
              console.log('3. Login with: sb-2gyyg46894003@personal.example.com');
              console.log('4. Complete the subscription');
            }
            
            resolve(response);
          } else {
            console.log('❌ Subscription creation failed');
            console.log('Error details:', response);
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(response)}`));
          }
        } catch (error) {
          reject(new Error(`Parse error: ${error.message}, Data: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  try {
    const accessToken = await getAccessToken();
    const subscription = await createSubscription(accessToken);
    
    console.log('\n🎉 Test completed successfully!');
    
  } catch (error) {
    console.log('\n❌ Test failed:', error.message);
    
    console.log('\n🔧 Possible solutions:');
    console.log('1. Check if your PayPal app has Subscriptions enabled');
    console.log('2. Verify plan IDs are correct');
    console.log('3. Make sure return/cancel URLs are valid');
    console.log('4. Try using a different test email');
  }
}

main();