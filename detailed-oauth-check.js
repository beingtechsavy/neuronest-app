/**
 * Detailed OAuth Check
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function detailedCheck() {
  console.log('🔍 Detailed OAuth Analysis\n')
  
  // Get all users
  const { data: { users }, error } = await supabase.auth.admin.listUsers()
  
  if (error) {
    console.log('❌ Error:', error.message)
    return
  }
  
  console.log(`Total users: ${users.length}\n`)
  
  // Analyze authentication methods
  const authMethods = {
    email: 0,
    google: 0,
    other: 0
  }
  
  const googleUsers = []
  
  users.forEach(user => {
    // Check app_metadata
    const provider = user.app_metadata?.provider
    
    // Check identities array
    const hasGoogleIdentity = user.identities?.some(i => i.provider === 'google')
    
    if (hasGoogleIdentity || provider === 'google') {
      authMethods.google++
      googleUsers.push(user)
    } else if (provider === 'email') {
      authMethods.email++
    } else {
      authMethods.other++
    }
  })
  
  console.log('Authentication Methods:')
  console.log(`  Email: ${authMethods.email}`)
  console.log(`  Google: ${authMethods.google}`)
  console.log(`  Other: ${authMethods.other}\n`)
  
  // Show recent Google users
  if (googleUsers.length > 0) {
    console.log('Recent Google OAuth Users:')
    console.log('─'.repeat(70))
    
    const recent = googleUsers
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10)
    
    for (const user of recent) {
      // Check if profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('id', user.id)
        .single()
      
      // Check if usage_limits exists
      const { data: limits } = await supabase
        .from('usage_limits')
        .select('user_id')
        .eq('user_id', user.id)
        .single()
      
      const profileStatus = profile ? '✅' : '❌'
      const limitsStatus = limits ? '✅' : '❌'
      
      console.log(`${user.email}`)
      console.log(`  Created: ${new Date(user.created_at).toLocaleString()}`)
      console.log(`  Profile: ${profileStatus} | Usage Limits: ${limitsStatus}`)
      console.log(`  Provider: ${user.app_metadata?.provider || 'unknown'}`)
      console.log(`  Identities: ${user.identities?.map(i => i.provider).join(', ') || 'none'}`)
      console.log('')
    }
  } else {
    console.log('⚠️  No Google OAuth users found\n')
    console.log('This could mean:')
    console.log('1. Google OAuth is not configured in Supabase')
    console.log('2. No one has tried to sign up with Google yet')
    console.log('3. Previous Google users were deleted\n')
  }
  
  // Check callback URL configuration
  console.log('📋 Configuration Checklist:')
  console.log('─'.repeat(70))
  console.log('□ Supabase Dashboard > Authentication > Providers > Google')
  console.log('  - Ensure Google OAuth is enabled')
  console.log('  - Client ID and Secret configured')
  console.log('')
  console.log('□ Supabase Dashboard > Authentication > URL Configuration')
  console.log('  - Site URL: https://www.neuronest.work')
  console.log('  - Redirect URLs should include:')
  console.log('    • https://www.neuronest.work/auth/callback')
  console.log('    • http://localhost:3000/auth/callback (for testing)')
  console.log('')
  console.log('□ Google Cloud Console')
  console.log('  - Authorized redirect URIs should include:')
  console.log('    • https://gbrldrmrqkvvtswqeqxf.supabase.co/auth/v1/callback')
  console.log('')
  console.log('□ Database Triggers')
  console.log('  - Check if trigger exists for profile creation')
  console.log('  - Run: SELECT * FROM pg_trigger WHERE tgname LIKE \'%profile%\';')
}

detailedCheck().catch(console.error)
