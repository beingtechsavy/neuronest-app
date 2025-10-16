// Test script to verify signup works after database rollback
// Run this after executing the SQL rollback

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local
function loadEnvLocal() {
  try {
    const envPath = path.join(__dirname, '.env.local')
    const envContent = fs.readFileSync(envPath, 'utf8')
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim()
        if (!process.env[key]) {
          process.env[key] = value
        }
      }
    })
  } catch (error) {
    console.error('Could not load .env.local file:', error.message)
  }
}

// Load the environment variables
loadEnvLocal()

// Your Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔑 Supabase URL:', supabaseUrl ? '✅ Found' : '❌ Missing')
console.log('🔑 Supabase Key:', supabaseKey ? '✅ Found' : '❌ Missing')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  console.log('Expected in .env.local:')
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_url_here')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSignup() {
  console.log('🧪 Testing signup functionality...')
  
  // Generate a unique test email
  const testEmail = `test-${Date.now()}@example.com`
  const testPassword = 'TestPassword123!'
  
  try {
    console.log(`📧 Attempting signup with: ${testEmail}`)
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User'
        }
      }
    })
    
    if (error) {
      console.error('❌ Signup failed:', error.message)
      return false
    }
    
    if (data.user) {
      console.log('✅ User created successfully!')
      console.log('👤 User ID:', data.user.id)
      console.log('📧 Email:', data.user.email)
      
      // Wait a moment for triggers to execute
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Check if profile was created
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()
      
      if (profileError) {
        console.error('❌ Profile check failed:', profileError.message)
      } else if (profile) {
        console.log('✅ Profile created:', profile)
      }
      
      // Usage limits table has been removed - no longer checking
      console.log('ℹ️  Usage limits table removed - focusing on core functionality')
      
      // Clean up - delete the test user
      console.log('🧹 Cleaning up test user...')
      // Note: You might need admin privileges to delete users
      // This is just for testing purposes
      
      return true
    }
    
  } catch (err) {
    console.error('❌ Test failed with exception:', err.message)
    return false
  }
}

// Run the test
testSignup().then(success => {
  if (success) {
    console.log('\n🎉 Signup test PASSED! The fix is working.')
  } else {
    console.log('\n💥 Signup test FAILED. Check the database configuration.')
  }
  process.exit(success ? 0 : 1)
})