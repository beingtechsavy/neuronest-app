// Create fresh PayPal plans in current sandbox
const https = require('https');
const fs = require('fs');

// Read current credentials
let CLIENT_ID, CLIENT_SECRET;
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
  });
} catch (error) {
  console.log('❌ Error reading credentials:', error.message);
  process.exit(1);
}

console.log('🚀 Creating Fresh PayPal Plans');
console.log('==============================');
console.log('Using Client ID:', CLIENT_ID ? CLIENT_ID.substring(0, 20) + '...' : 'NOT FOUND');

async function getAccessToken() {
  console.log('🔐 Getting access token...');
  
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
        'Content-Length': Buffer.byteLength(postData)
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
          if (res.statusCode === 200) {
            console.log('✅ Access token obtained');
            resolve(response.access_token);
          } else {
            console.log('❌ Token request failed');
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(response)}`));
          }
        } catch (error) {
          reject(new Error(`Parse error: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function createProduct(accessToken, productData) {
  console.log(`📦 Creating product: ${productData.name}...`);
  
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(productData);
    
    const options = {
      hostname: 'api-m.sandbox.paypal.com',
      port: 443,
      path: '/v1/catalogs/products',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`Product response status: ${res.statusCode}`);
        console.log(`Product response data: ${data}`);
        
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 201) {
            console.log(`✅ Product created: ${response.id}`);
            resolve(response);
          } else {
            reject(new Error(`Product creation failed: ${JSON.stringify(response)}`));
          }
        } catch (error) {
          reject(new Error(`Product parse error: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function createPlan(accessToken, planData) {
  console.log(`📋 Creating plan: ${planData.name}...`);
  
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(planData);
    
    const options = {
      hostname: 'api-m.sandbox.paypal.com',
      port: 443,
      path: '/v1/billing/plans',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`Plan response status: ${res.statusCode}`);
        console.log(`Plan response data: ${data}`);
        
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 201) {
            console.log(`✅ Plan created: ${response.id}`);
            resolve(response);
          } else {
            reject(new Error(`Plan creation failed: ${JSON.stringify(response)}`));
          }
        } catch (error) {
          reject(new Error(`Plan parse error: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function main() {
  try {
    // Get access token
    const accessToken = await getAccessToken();
    
    // Create products
    const masterProduct = await createProduct(accessToken, {
      name: "NeuroNest Master",
      description: "Unlimited AI task breakdowns and premium features",
      type: "SERVICE",
      category: "SOFTWARE"
    });
    
    const warriorProduct = await createProduct(accessToken, {
      name: "NeuroNest Warrior",
      description: "Everything in Master plus advanced analytics and priority support",
      type: "SERVICE", 
      category: "SOFTWARE"
    });
    
    // Create plans
    const masterPlan = await createPlan(accessToken, {
      product_id: masterProduct.id,
      name: "NeuroNest Master Monthly",
      description: "Monthly subscription to NeuroNest Master plan",
      status: "ACTIVE",
      billing_cycles: [{
        frequency: {
          interval_unit: "MONTH",
          interval_count: 1
        },
        tenure_type: "REGULAR",
        sequence: 1,
        total_cycles: 0,
        pricing_scheme: {
          fixed_price: {
            value: "6.99",
            currency_code: "USD"
          }
        }
      }],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee: {
          value: "0",
          currency_code: "USD"
        },
        setup_fee_failure_action: "CONTINUE",
        payment_failure_threshold: 3
      },
      taxes: {
        percentage: "0",
        inclusive: false
      }
    });
    
    const warriorPlan = await createPlan(accessToken, {
      product_id: warriorProduct.id,
      name: "NeuroNest Warrior Monthly", 
      description: "Monthly subscription to NeuroNest Warrior plan",
      status: "ACTIVE",
      billing_cycles: [{
        frequency: {
          interval_unit: "MONTH",
          interval_count: 1
        },
        tenure_type: "REGULAR",
        sequence: 1,
        total_cycles: 0,
        pricing_scheme: {
          fixed_price: {
            value: "9.99",
            currency_code: "USD"
          }
        }
      }],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee: {
          value: "0",
          currency_code: "USD"
        },
        setup_fee_failure_action: "CONTINUE",
        payment_failure_threshold: 3
      },
      taxes: {
        percentage: "0",
        inclusive: false
      }
    });
    
    console.log('\n🎉 SUCCESS! Update your .env.local with these plan IDs:');
    console.log(`NEXT_PUBLIC_PAYPAL_MASTER_PLAN_ID=${masterPlan.id}`);
    console.log(`NEXT_PUBLIC_PAYPAL_WARRIOR_PLAN_ID=${warriorPlan.id}`);
    
  } catch (error) {
    console.log('\n❌ Error:', error.message);
  }
}

main();