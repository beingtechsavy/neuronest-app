// Create a personal PayPal test account for testing purchases
const https = require('https');
const fs = require('fs');

// Read credentials
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

async function getAccessToken() {
  console.log('🔐 Getting access token...');
  
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  
  return new Promise((resolve, reject) => {
    const postData = 'grant_type=client_credentials';
    
    const options = {
      hostname: 'api.sandbox.paypal.com',
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
            resolve(response.access_token);
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

async function createPersonalAccount(accessToken) {
  console.log('👤 Creating personal test account...');
  
  const accountData = {
    account_type: 'PERSONAL',
    country_code: 'US',
    business_name: 'Test Customer',
    email_address: `testcustomer${Date.now()}@personal.example.com`,
    password: 'testpass123',
    account_balance: {
      currency_code: 'USD',
      value: '1000.00'
    }
  };
  
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(accountData);
    
    const options = {
      hostname: 'api.sandbox.paypal.com',
      port: 443,
      path: '/v2/customer/sandbox-accounts',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
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
            console.log('✅ Personal account created successfully!');
            resolve(response);
          } else {
            reject(new Error(`Account creation failed: ${JSON.stringify(response)}`));
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
    console.log('🚀 Creating PayPal Personal Test Account');
    console.log('=====================================');
    
    const accessToken = await getAccessToken();
    console.log('✅ Access token obtained');
    
    const account = await createPersonalAccount(accessToken);
    
    console.log('\n🎉 SUCCESS! Use these credentials for testing:');
    console.log('============================================');
    console.log('Email:', account.email_address);
    console.log('Password: testpass123');
    console.log('Balance: $1000.00 USD');
    console.log('\n📝 How to test:');
    console.log('1. Go to your pricing page');
    console.log('2. Click on a subscription plan');
    console.log('3. When PayPal asks for login, use the above credentials');
    console.log('4. Complete the test payment');
    
  } catch (error) {
    console.log('\n❌ Error:', error.message);
    console.log('\n💡 Alternative: Create account manually at:');
    console.log('https://developer.paypal.com/developer/accounts/');
  }
}

main();