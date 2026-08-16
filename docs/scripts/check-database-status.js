#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read environment variables from .env.local
let SUPABASE_URL = '';
let SUPABASE_SERVICE_KEY = '';

try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const lines = envContent.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      SUPABASE_URL = line.split('=')[1].trim();
    }
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      SUPABASE_SERVICE_KEY = line.split('=')[1].trim();
    }
  }
} catch (error) {
  console.log('❌ Could not read .env.local file:', error.message);
  process.exit(1);
}

console.log('🔍 Checking Database Status...');
console.log('');

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.log('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkTables() {
  console.log('📊 Checking if required tables exist...');
  console.log('');
  
  // Check subscriptions table
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ subscriptions table:', error.message);
    } else {
      console.log('✅ subscriptions table: EXISTS');
      console.log('   Records:', data.length);
    }
  } catch (error) {
    console.log('❌ subscriptions table: ERROR -', error.message);
  }
  
  // Check payment_logs table
  try {
    const { data, error } = await supabase
      .from('payment_logs')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ payment_logs table:', error.message);
    } else {
      console.log('✅ payment_logs table: EXISTS');
      console.log('   Records:', data.length);
    }
  } catch (error) {
    console.log('❌ payment_logs table: ERROR -', error.message);
  }
  
  console.log('');
}

async function testSubscriptionInsert() {
  console.log('🧪 Testing subscription insert...');
  
  const testData = {
    user_id: '00000000-0000-0000-0000-000000000000', // Test UUID
    plan_type: 'warrior',
    status: 'active',
    razorpay_subscription_id: 'sub_test_123',
    razorpay_payment_id: 'pay_test_123',
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert(testData)
      .select()
      .single();
    
    if (error) {
      console.log('❌ Test insert failed:', error.message);
      console.log('   Details:', error.details);
      console.log('   Hint:', error.hint);
    } else {
      console.log('✅ Test insert successful!');
      
      // Clean up test data
      await supabase
        .from('subscriptions')
        .delete()
        .eq('razorpay_subscription_id', 'sub_test_123');
      
      console.log('✅ Test data cleaned up');
    }
  } catch (error) {
    console.log('❌ Test insert error:', error.message);
  }
  
  console.log('');
}

async function runDiagnostics() {
  console.log('🚀 Database Diagnostics for NeuroNest');
  console.log('=' .repeat(50));
  
  await checkTables();
  await testSubscriptionInsert();
  
  console.log('💡 If tables are missing, run:');
  console.log('   1. Go to Supabase Dashboard → SQL Editor');
  console.log('   2. Run the migration script: run-database-migration.sql');
  console.log('');
  console.log('🔧 If tables exist but insert fails:');
  console.log('   - Check RLS policies');
  console.log('   - Verify service role permissions');
  console.log('   - Check table constraints');
}

runDiagnostics().catch(console.error);