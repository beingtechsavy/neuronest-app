/**
 * Production Readiness Check for Google OAuth
 * Run this before deploying to production
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkProductionReadiness() {
  console.log('🔍 Production Readiness Check for Google OAuth\n')
  console.log('=' .repeat(70))
  
  let allChecks = true
  
  // 1. Environment Variables
  console.log('\n1️⃣ Checking Environment Variables...')
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]
  
  requiredEnvVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: Set`)
    } else {
      console.log(`❌ ${varName}: MISSING`)
      allChecks = false
    }
  })
  
  // 2. Supabase Connection
  console.log('\n2️⃣ Testing Supabase Connection...')
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1)
    if (error) throw error
    console.log('✅ Supabase connection successful')
  } catch (error) {
    console.log('❌ Supabase connection failed:', error.message)
    allChecks = false
  }
  
  // 3. Check Google OAuth Users
  console.log('\n3️⃣ Checking Google OAuth History...')
  try {
    const { data: { users }, error } = await supabase.auth.admin.listUsers()
    if (error) throw error
    
    const googleUsers = users.filter(u => u.app_metadata?.provider === 'google')
    console.log(`✅ Found ${googleUsers.length} Google OAuth users`)
    
    if (googleUsers.length > 0) {
      console.log('✅ Google OAuth has worked before')
      
      // Check recent user
      const recentUser = googleUsers.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      )[0]
      
      console.log(`   Most recent: ${recentUser.email} (${new Date(recentUser.created_at).toLocaleDateString()})`)
    } else {
      console.log('⚠️  No Google OAuth users found (might be first deployment)')
    }
  } catch (error) {
    console.log('❌ Failed to check users:', error.message)
    allChecks = false
  }
  
  // 4. Check Database Triggers
  console.log('\n4️⃣ Checking Database Triggers...')
  try {
    // Try to check if profiles table is accessible
    const { data, error } = await supabase.from('profiles').select('id').limit(1)
    if (error) throw error
    console.log('✅ Profiles table accessible')
    console.log('⚠️  Cannot verify triggers from client (check Supabase dashboard)')
  } catch (error) {
    console.log('❌ Profiles table error:', error.message)
    allChecks = false
  }
  
  // 5. Check Usage Limits Table
  console.log('\n5️⃣ Checking Usage Limits Table...')
  try {
    const { data, error } = await supabase.from('usage_limits').select('user_id').limit(1)
    if (error) throw error
    console.log('✅ Usage limits table accessible')
  } catch (error) {
    console.log('❌ Usage limits table error:', error.message)
    allChecks = false
  }
  
  // 6. Configuration Checklist
  console.log('\n6️⃣ Configuration Checklist (Manual Verification Required):')
  console.log('─'.repeat(70))
  console.log('\n📋 Supabase Dashboard → Authentication → URL Configuration:')
  console.log('   □ Site URL: https://www.neuronest.work')
  console.log('   □ Redirect URLs include: https://www.neuronest.work/auth/callback')
  console.log('')
  console.log('📋 Supabase Dashboard → Authentication → Providers → Google:')
  console.log('   □ Enabled: YES')
  console.log('   □ Client ID: Configured')
  console.log('   □ Client Secret: Configured')
  console.log('')
  console.log('📋 Google Cloud Console → APIs & Services → Credentials:')
  console.log('   □ Authorized redirect URIs include:')
  console.log('     https://gbrldrmrqkvvtswqeqxf.supabase.co/auth/v1/callback')
  console.log('')
  console.log('📋 Vercel Dashboard → Settings → Environment Variables:')
  console.log('   □ NEXT_PUBLIC_SUPABASE_URL: Set for Production')
  console.log('   □ NEXT_PUBLIC_SUPABASE_ANON_KEY: Set for Production')
  console.log('   □ SUPABASE_SERVICE_ROLE_KEY: Set for Production')
  
  // 7. Code Files Check
  console.log('\n7️⃣ Checking Code Files...')
  const fs = require('fs')
  const path = require('path')
  
  const requiredFiles = [
    'src/app/auth/callback/route.ts',
    'src/lib/supabaseClient.ts',
    'src/components/GoogleSignInButton.tsx'
  ]
  
  requiredFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file)
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file}: Exists`)
    } else {
      console.log(`❌ ${file}: MISSING`)
      allChecks = false
    }
  })
  
  // 8. Build Test
  console.log('\n8️⃣ Build Test Recommendation:')
  console.log('⚠️  Run "npm run build" to ensure no build errors')
  console.log('   This check cannot run automatically')
  
  // Summary
  console.log('\n' + '='.repeat(70))
  if (allChecks) {
    console.log('✅ All automated checks PASSED')
    console.log('\n📋 Next Steps:')
    console.log('1. Verify manual configuration checklist above')
    console.log('2. Run: npm run build')
    console.log('3. If build succeeds, deploy to production')
    console.log('4. Test OAuth immediately after deployment')
    console.log('\n🚀 Ready for production deployment!')
  } else {
    console.log('❌ Some checks FAILED')
    console.log('\n⚠️  Fix the issues above before deploying')
    console.log('   Review PRODUCTION_DEPLOYMENT_CHECKLIST.md for details')
  }
  
  console.log('\n' + '='.repeat(70))
}

checkProductionReadiness().catch(console.error)
