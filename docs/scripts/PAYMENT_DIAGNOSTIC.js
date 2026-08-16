// PAYMENT DIAGNOSTIC - Run this in browser console on pricing page
// This will help identify why payment buttons aren't working

const testPaymentFlow = async () => {
  console.log('🔍 PAYMENT DIAGNOSTIC STARTING...');
  
  // 1. Check if Razorpay script loads
  console.log('📦 Checking Razorpay script...');
  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  
  script.onload = () => {
    console.log('✅ Razorpay script loaded successfully');
    console.log('🔑 Razorpay available:', typeof window.Razorpay !== 'undefined');
  };
  
  script.onerror = () => {
    console.error('❌ Failed to load Razorpay script');
  };
  
  document.head.appendChild(script);
  
  // 2. Test API endpoint
  console.log('🌐 Testing create-order API...');
  try {
    const response = await fetch('/api/razorpay/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 6.99,
        currency: 'USD',
        planName: 'Master',
        userId: 'test-user-id'
      })
    });
    
    const data = await response.json();
    console.log('📡 API Response Status:', response.status);
    console.log('📡 API Response Data:', data);
    
    if (!response.ok) {
      console.error('❌ API Error:', data.error);
    } else {
      console.log('✅ API working correctly');
    }
  } catch (error) {
    console.error('❌ API Request failed:', error);
  }
  
  // 3. Check environment variables (client-side)
  console.log('🔧 Environment Check:');
  console.log('- App URL:', process.env.NEXT_PUBLIC_APP_URL || 'Not set');
  console.log('- Razorpay Key ID:', process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'Not set');
  
  // 4. Check current URL
  console.log('🌍 Current URL:', window.location.href);
  console.log('🌍 Is localhost?', window.location.hostname === 'localhost');
  console.log('🌍 Is development?', window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1'));
  
  // 5. Check if user is logged in
  console.log('👤 Checking user authentication...');
  // This will depend on your auth setup
  
  console.log('🔍 DIAGNOSTIC COMPLETE - Check results above');
};

// Run the diagnostic
testPaymentFlow();

// Instructions:
// 1. Go to your pricing page
// 2. Open browser console (F12)
// 3. Copy and paste this entire script
// 4. Press Enter to run
// 5. Check the console output for issues