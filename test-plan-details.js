// Test plan details to ensure they're configured correctly
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

async function getPlanDetails(accessToken, planId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api-m.sandbox.paypal.com',
      port: 443,
      path: `/v1/billing/plans/${planId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const response = JSON.parse(data);
        resolve(response);
      });
    });

    req.end();
  });
}

async function main() {
  try {
    console.log('🔍 Checking Plan Configuration');
    console.log('=============================');
    
    const accessToken = await getAccessToken();
    const planDetails = await getPlanDetails(accessToken, MASTER_PLAN_ID);
    
    console.log('Plan ID:', planDetails.id);
    console.log('Plan Name:', planDetails.name);
    console.log('Plan Status:', planDetails.status);
    console.log('Product ID:', planDetails.product_id);
    
    if (planDetails.billing_cycles && planDetails.billing_cycles[0]) {
      const cycle = planDetails.billing_cycles[0];
      console.log('Billing Frequency:', cycle.frequency.interval_count, cycle.frequency.interval_unit);
      console.log('Price:', cycle.pricing_scheme.fixed_price.value, cycle.pricing_scheme.fixed_price.currency_code);
    }
    
    console.log('\n✅ Plan configuration looks good!');
    console.log('\n🔧 Try this simplified subscription test:');
    
    // Create a simple subscription for testing
    const simpleSubscriptionData = {
      plan_id: MASTER_PLAN_ID,
      subscriber: {
        name: {
          given_name: "John",
          surname: "Doe"
        },
        email_address: "sb-2gyyg46894003@personal.example.com",
      },
      application_context: {
        brand_name: 'NeuroNest',
        locale: 'en-US',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        return_url: 'http://localhost:3001/dashboard?success=true',
        cancel_url: 'http://localhost:3001/pricing?canceled=true',
      },
    };
    
    console.log('\nSimplified subscription data:');
    console.log(JSON.stringify(simpleSubscriptionData, null, 2));
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

main();