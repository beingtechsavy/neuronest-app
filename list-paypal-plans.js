// List all PayPal plans in your sandbox
const https = require('https');

const PAYPAL_CLIENT_ID = 'ATsOroucb3gpA3KZl7QaVWRS4R91VNNO5pOSkTIA_TokWayvKuKWMHbPyE4xaQBDxkrFS-mhfMg-Toos';
const PAYPAL_CLIENT_SECRET = 'EDdLWWwKdmOsZa5Y3pVqZUf7Hwbm5Y-XgoyrdPtZSL5w8QcJ5pOk3t4NWaF6Mh71OKW0_B9AB6B221UD';

async function getAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  
  return new Promise((resolve, reject) => {
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

    req.write('grant_type=client_credentials');
    req.end();
  });
}

async function listPlans(accessToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api-m.sandbox.paypal.com',
      port: 443,
      path: '/v1/billing/plans?page_size=20',
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
        try {
          const response = JSON.parse(data);
          console.log('📋 Your PayPal Plans:');
          console.log('===================');
          
          if (response.plans && response.plans.length > 0) {
            response.plans.forEach((plan, index) => {
              console.log(`\n${index + 1}. ${plan.name}`);
              console.log(`   ID: ${plan.id}`);
              console.log(`   Status: ${plan.status}`);
              console.log(`   Description: ${plan.description}`);
              if (plan.billing_cycles && plan.billing_cycles[0]) {
                const price = plan.billing_cycles[0].pricing_scheme?.fixed_price;
                if (price) {
                  console.log(`   Price: ${price.value} ${price.currency_code}`);
                }
              }
            });
            
            console.log('\n🎯 Copy the correct Plan IDs to your .env.local:');
            response.plans.forEach(plan => {
              if (plan.name.toLowerCase().includes('master')) {
                console.log(`NEXT_PUBLIC_PAYPAL_MASTER_PLAN_ID=${plan.id}`);
              }
              if (plan.name.toLowerCase().includes('warrior')) {
                console.log(`NEXT_PUBLIC_PAYPAL_WARRIOR_PLAN_ID=${plan.id}`);
              }
            });
          } else {
            console.log('❌ No plans found in your sandbox.');
            console.log('\n📝 You need to create plans first:');
            console.log('1. Go to https://developer.paypal.com/developer/applications/');
            console.log('2. Click on your sandbox app');
            console.log('3. Go to Features tab');
            console.log('4. Enable Subscriptions');
            console.log('5. Create your subscription plans');
          }
        } catch (error) {
          console.log('❌ Error parsing response:', error.message);
          console.log('Raw response:', data);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Request error:', error.message);
    });

    req.end();
  });
}

async function main() {
  try {
    console.log('🔐 Getting PayPal access token...');
    const accessToken = await getAccessToken();
    console.log('✅ Access token obtained');
    
    await listPlans(accessToken);
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

main();