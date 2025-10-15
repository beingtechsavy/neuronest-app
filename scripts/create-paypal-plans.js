const https = require('https');

// PayPal API configuration
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_BASE_URL = 'https://api-m.sandbox.paypal.com'; // Sandbox URL

// Function to get access token
async function getAccessToken() {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    
    const postData = 'grant_type=client_credentials';
    
    const options = {
      hostname: 'api-m.sandbox.paypal.com',
      port: 443,
      path: '/v1/oauth2/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response.access_token);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Function to create a product
async function createProduct(accessToken, productData) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(productData);
    
    const options = {
      hostname: 'api-m.sandbox.paypal.com',
      port: 443,
      path: '/v1/catalogs/products',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Function to create a subscription plan
async function createPlan(accessToken, planData) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(planData);
    
    const options = {
      hostname: 'api-m.sandbox.paypal.com',
      port: 443,
      path: '/v1/billing/plans',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Product configurations
const masterProduct = {
  name: "NeuroNest Master",
  description: "Unlimited AI task breakdowns and premium features for enhanced productivity",
  type: "SERVICE",
  category: "SOFTWARE"
};

const warriorProduct = {
  name: "NeuroNest Warrior", 
  description: "Everything in Master plus advanced analytics and priority support",
  type: "SERVICE",
  category: "SOFTWARE"
};

// Plan configurations (will be updated with product IDs)
const createMasterPlan = (productId) => ({
  product_id: productId,
  name: "NeuroNest Master Monthly",
  description: "Monthly subscription to NeuroNest Master plan",
  status: "ACTIVE",
  billing_cycles: [
    {
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
    }
  ],
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

const createWarriorPlan = (productId) => ({
  product_id: productId,
  name: "NeuroNest Warrior Monthly",
  description: "Monthly subscription to NeuroNest Warrior plan",
  status: "ACTIVE",
  billing_cycles: [
    {
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
    }
  ],
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

// Main function
async function createPlans() {
  try {
    console.log('🔐 Getting PayPal access token...');
    const accessToken = await getAccessToken();
    console.log('✅ Access token obtained');

    // Create products first
    console.log('📦 Creating Master Product...');
    const masterProductResult = await createProduct(accessToken, masterProduct);
    console.log('✅ Master Product created:', masterProductResult.id);

    console.log('📦 Creating Warrior Product...');
    const warriorProductResult = await createProduct(accessToken, warriorProduct);
    console.log('✅ Warrior Product created:', warriorProductResult.id);

    // Create plans using product IDs
    console.log('📋 Creating Master Plan ($6.99/month)...');
    const masterPlanResult = await createPlan(accessToken, createMasterPlan(masterProductResult.id));
    console.log('✅ Master Plan created:', masterPlanResult.id);

    console.log('📋 Creating Warrior Plan ($9.99/month)...');
    const warriorPlanResult = await createPlan(accessToken, createWarriorPlan(warriorProductResult.id));
    console.log('✅ Warrior Plan created:', warriorPlanResult.id);

    console.log('\n🎉 SUCCESS! Add these to your .env.local:');
    console.log(`PAYPAL_MASTER_PLAN_ID=${masterPlanResult.id}`);
    console.log(`PAYPAL_WARRIOR_PLAN_ID=${warriorPlanResult.id}`);

  } catch (error) {
    console.error('❌ Error:', error);
    if (error.response) {
      console.error('Response:', error.response);
    }
  }
}

// Run the script
createPlans();