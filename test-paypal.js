// Simple PayPal API test
const https = require('https');

const PAYPAL_CLIENT_ID = 'ATsOroucb3gpA3KZl7QaVWRS4R91VNNO5pOSkTIA_TokWayvKuKWMHbPyE4xaQBDxkrFS-mhfMg-Toos';
const PAYPAL_CLIENT_SECRET = 'EDdLWWwKdmOsZa5Y3pVqZUf7Hwbm5Y-XgoyrdPtZSL5w8QcJ5pOk3t4NWaF6Mh71OKW0_B9AB6B221UD';
const MASTER_PLAN_ID = 'P-2TV61650DP327202KNDWUPBI';
const WARRIOR_PLAN_ID = 'P-3CW36969CV017792SNDWUUCQ';

async function testPayPalConnection() {
  console.log('🔐 Testing PayPal connection...');
  
  // Get access token
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  
  const tokenOptions = {
    hostname: 'api-m.sandbox.paypal.com',
    port: 443,
    path: '/v1/oauth2/token',
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(tokenOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200) {
            console.log('✅ PayPal connection successful');
            console.log('Access token obtained:', response.access_token.substring(0, 20) + '...');
            testPlanAccess(response.access_token);
          } else {
            console.log('❌ PayPal connection failed:', response);
          }
        } catch (error) {
          console.log('❌ Parse error:', error.message);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Request error:', error.message);
    });

    req.write('grant_type=client_credentials');
    req.end();
  });
}

async function testPlanAccess(accessToken) {
  console.log('📋 Testing plan access...');
  
  // Test Master plan
  const masterOptions = {
    hostname: 'api-m.sandbox.paypal.com',
    port: 443,
    path: `/v1/billing/plans/${MASTER_PLAN_ID}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }
  };

  const req = https.request(masterOptions, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        if (res.statusCode === 200) {
          console.log('✅ Master Plan accessible:', response.name);
          console.log('   Status:', response.status);
          console.log('   Price:', response.billing_cycles[0].pricing_scheme.fixed_price.value, response.billing_cycles[0].pricing_scheme.fixed_price.currency_code);
        } else {
          console.log('❌ Master Plan access failed:', response);
        }
      } catch (error) {
        console.log('❌ Master Plan parse error:', error.message);
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Master Plan request error:', error.message);
  });

  req.end();

  // Test Warrior plan
  setTimeout(() => {
    const warriorOptions = {
      hostname: 'api-m.sandbox.paypal.com',
      port: 443,
      path: `/v1/billing/plans/${WARRIOR_PLAN_ID}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    };

    const req2 = https.request(warriorOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200) {
            console.log('✅ Warrior Plan accessible:', response.name);
            console.log('   Status:', response.status);
            console.log('   Price:', response.billing_cycles[0].pricing_scheme.fixed_price.value, response.billing_cycles[0].pricing_scheme.fixed_price.currency_code);
            console.log('\n🎉 PayPal integration is working correctly!');
            console.log('\n📝 Next steps:');
            console.log('1. Start your development server: npm run dev');
            console.log('2. Go to http://localhost:3000/pricing');
            console.log('3. Test the subscription flow');
          } else {
            console.log('❌ Warrior Plan access failed:', response);
          }
        } catch (error) {
          console.log('❌ Warrior Plan parse error:', error.message);
        }
      });
    });

    req2.on('error', (error) => {
      console.log('❌ Warrior Plan request error:', error.message);
    });

    req2.end();
  }, 1000);
}

testPayPalConnection();