// Test with the most minimal PayPal subscription configuration
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

async function getAccessToken() {
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
        const response = JSON.parse(data);
        resolve(response.access_token);
      });
    });

    req.write(postData);
    req.end();
  });
}

async function createMinimalSubscription(accessToken) {
  console.log('🧪 Testing MINIMAL subscription configuration...');
  
  // Absolute minimal configuration
  const subscriptionData = {
    plan_id: MASTER_PLAN_ID,
    application_context: {
      return_url: 'https://example.com/success',
      cancel_url: 'https://example.com/cancel',
    },
  };
  
  console.log('Minimal subscription data:', JSON.stringify(subscriptionData, null, 2));
  
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
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('Response status:', res.statusCode);
        console.log('Response data:', data);
        
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 201) {
            const approvalUrl = response.links.find(link => link.rel === 'approve')?.href;
            console.log('\n✅ MINIMAL subscription created!');
            console.log('🔗 Test this URL:', approvalUrl);
            resolve(response);
          } else {
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

async function main() {
  try {
    console.log('🔬 Testing Minimal PayPal Subscription');
    console.log('=====================================');
    
    const accessToken = await getAccessToken();
    console.log('✅ Access token obtained');
    
    await createMinimalSubscription(accessToken);
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

main();