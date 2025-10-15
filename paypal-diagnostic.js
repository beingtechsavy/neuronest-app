// Comprehensive PayPal Integration Diagnostic
const https = require('https');

// Read credentials from .env.local
const fs = require('fs');
let PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, MASTER_PLAN_ID, WARRIOR_PLAN_ID;

try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const lines = envContent.split('\n');
  
  lines.forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_PAYPAL_CLIENT_ID=')) {
      PAYPAL_CLIENT_ID = line.split('=')[1];
    }
    if (line.startsWith('PAYPAL_CLIENT_SECRET=')) {
      PAYPAL_CLIENT_SECRET = line.split('=')[1];
    }
    if (line.startsWith('NEXT_PUBLIC_PAYPAL_MASTER_PLAN_ID=')) {
      MASTER_PLAN_ID = line.split('=')[1];
    }
    if (line.startsWith('NEXT_PUBLIC_PAYPAL_WARRIOR_PLAN_ID=')) {
      WARRIOR_PLAN_ID = line.split('=')[1];
    }
  });
} catch (error) {
  console.log('❌ Error reading .env.local:', error.message);
  process.exit(1);
}

console.log('🔍 PayPal Integration Diagnostic');
console.log('================================');
console.log('Client ID:', PAYPAL_CLIENT_ID ? PAYPAL_CLIENT_ID.substring(0, 20) + '...' : 'NOT FOUND');
console.log('Client Secret:', PAYPAL_CLIENT_SECRET ? 'Found (hidden)' : 'NOT FOUND');
console.log('Master Plan ID:', MASTER_PLAN_ID || 'NOT FOUND');
console.log('Warrior Plan ID:', WARRIOR_PLAN_ID || 'NOT FOUND');

// Determine environment
const isSandbox = PAYPAL_CLIENT_ID && (PAYPAL_CLIENT_ID.startsWith('AT') || PAYPAL_CLIENT_ID.startsWith('Ad'));
const isLive = PAYPAL_CLIENT_ID && PAYPAL_CLIENT_ID.startsWith('A') && !PAYPAL_CLIENT_ID.startsWith('AT') && !PAYPAL_CLIENT_ID.startsWith('Ad');
const baseUrl = isSandbox ? 'api-m.sandbox.paypal.com' : 'api-m.paypal.com';

console.log('Environment:', isSandbox ? 'SANDBOX' : isLive ? 'LIVE' : 'UNKNOWN');
console.log('Base URL:', baseUrl);
console.log('');

async function testConnection() {
  console.log('🔐 Step 1: Testing PayPal Authentication...');
  
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    console.log('❌ Missing PayPal credentials');
    return false;
  }

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  
  return new Promise((resolve) => {
    const options = {
      hostname: baseUrl,
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
            console.log('✅ Authentication successful');
            console.log('   Access token obtained');
            resolve(response.access_token);
          } else {
            console.log('❌ Authentication failed');
            console.log('   Status:', res.statusCode);
            console.log('   Error:', response.error || 'Unknown error');
            console.log('   Description:', response.error_description || 'No description');
            resolve(false);
          }
        } catch (error) {
          console.log('❌ Parse error:', error.message);
          console.log('   Raw response:', data);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Request error:', error.message);
      resolve(false);
    });

    req.write('grant_type=client_credentials');
    req.end();
  });
}

async function testPlanAccess(accessToken, planId, planName) {
  console.log(`\n🔍 Step 2: Testing ${planName} Plan Access...`);
  
  if (!planId) {
    console.log(`❌ ${planName} Plan ID not found`);
    return false;
  }

  return new Promise((resolve) => {
    const options = {
      hostname: baseUrl,
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
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200) {
            console.log(`✅ ${planName} Plan accessible`);
            console.log('   Name:', response.name);
            console.log('   Status:', response.status);
            if (response.billing_cycles && response.billing_cycles[0]) {
              const price = response.billing_cycles[0].pricing_scheme?.fixed_price;
              if (price) {
                console.log('   Price:', price.value, price.currency_code);
              }
            }
            resolve(true);
          } else {
            console.log(`❌ ${planName} Plan not accessible`);
            console.log('   Status:', res.statusCode);
            console.log('   Error:', response.name || 'Unknown error');
            console.log('   Message:', response.message || 'No message');
            resolve(false);
          }
        } catch (error) {
          console.log(`❌ ${planName} Plan parse error:`, error.message);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ${planName} Plan request error:`, error.message);
      resolve(false);
    });

    req.end();
  });
}

async function listAllPlans(accessToken) {
  console.log('\n📋 Step 3: Listing All Available Plans...');
  
  return new Promise((resolve) => {
    const options = {
      hostname: baseUrl,
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
          if (response.plans && response.plans.length > 0) {
            console.log(`✅ Found ${response.plans.length} plans:`);
            response.plans.forEach((plan, index) => {
              console.log(`\n   ${index + 1}. ${plan.name}`);
              console.log(`      ID: ${plan.id}`);
              console.log(`      Status: ${plan.status}`);
              if (plan.billing_cycles && plan.billing_cycles[0]) {
                const price = plan.billing_cycles[0].pricing_scheme?.fixed_price;
                if (price) {
                  console.log(`      Price: ${price.value} ${price.currency_code}`);
                }
              }
            });
            resolve(response.plans);
          } else {
            console.log('❌ No plans found');
            resolve([]);
          }
        } catch (error) {
          console.log('❌ Error listing plans:', error.message);
          resolve([]);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Request error:', error.message);
      resolve([]);
    });

    req.end();
  });
}

async function runDiagnostic() {
  try {
    // Test authentication
    const accessToken = await testConnection();
    if (!accessToken) {
      console.log('\n❌ DIAGNOSIS: Authentication failed. Check your PayPal credentials.');
      return;
    }

    // Test plan access
    const masterResult = await testPlanAccess(accessToken, MASTER_PLAN_ID, 'Master');
    const warriorResult = await testPlanAccess(accessToken, WARRIOR_PLAN_ID, 'Warrior');

    // List all plans
    const allPlans = await listAllPlans(accessToken);

    // Final diagnosis
    console.log('\n🎯 FINAL DIAGNOSIS:');
    console.log('==================');
    
    if (masterResult && warriorResult) {
      console.log('✅ PayPal integration is working perfectly!');
      console.log('✅ Both plans are accessible');
      console.log('\n📝 Next steps:');
      console.log('1. Start your dev server: npm run dev');
      console.log('2. Go to http://localhost:3000/pricing');
      console.log('3. Test the subscription flow');
    } else {
      console.log('⚠️  PayPal integration has issues:');
      
      if (!masterResult) {
        console.log('❌ Master plan not accessible');
      }
      if (!warriorResult) {
        console.log('❌ Warrior plan not accessible');
      }
      
      if (allPlans.length > 0) {
        console.log('\n💡 SOLUTION: Update your .env.local with correct plan IDs:');
        allPlans.forEach(plan => {
          if (plan.name.toLowerCase().includes('master') || plan.name.toLowerCase().includes('neuronest')) {
            console.log(`NEXT_PUBLIC_PAYPAL_MASTER_PLAN_ID=${plan.id}`);
          }
          if (plan.name.toLowerCase().includes('warrior') || plan.name.toLowerCase().includes('premium')) {
            console.log(`NEXT_PUBLIC_PAYPAL_WARRIOR_PLAN_ID=${plan.id}`);
          }
        });
      } else {
        console.log('\n💡 SOLUTION: Create subscription plans in PayPal Developer Console');
        console.log('1. Go to https://developer.paypal.com/developer/applications/');
        console.log('2. Click on your app');
        console.log('3. Go to Features tab');
        console.log('4. Enable Subscriptions');
        console.log('5. Create your plans');
      }
    }
    
  } catch (error) {
    console.log('\n❌ DIAGNOSIS ERROR:', error.message);
  }
}

runDiagnostic();