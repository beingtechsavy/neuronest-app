/**
 * Quick OAuth Setup Check
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkSetup() {
  console.log('🔍 Checking OAuth Setup\n')
  
  // 1. Check if profiles table exists and is accessible
  console.log('1️⃣ Testing profiles table access...')
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .limit(1)
  
  if (profileError) {
    console.log('❌ Cannot access profiles table:', profileError.message)
    return
  }
  console.log('✅ Profiles table accessible\n')
  
  // 2. Check recent Google users
  console.log('2️⃣ Checking recent Google OAuth users...')
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
  
  if (usersError) {
    console.log('❌ Cannot list users:', usersError.message)
    return
  }
  
  const googleUsers = users.filter(u => 
    u.identities?.some(i => i.provider === 'google')
  )
  
  console.log(`Total users: ${users.length}`)
  console.log(`Google OAuth users: ${googleUsers.length}\n`)
  
  // 3. Check if Google users have profiles
  console.log('3️⃣ Checking profile creation for Google users...')
  
  const recentGoogleUsers = googleUsers
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5)
  
  for (const user of recentGoogleUsers) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('id', user.id)
      .single()
    
    const hasProfile = !!profile
    const icon = hasProfile ? '✅' : '❌'
    console.log(`${icon} ${user.email} - Profile: ${hasProfile ? 'YES' : 'MISSING'}`)
  }
  
  // 4. Test creating a profile manually
  console.log('\n4️⃣ Testing manual profile creation...')
  const testId = 'test-' + Date.now()
  
  const { error: insertError } = await supabase
    .from('profiles')
    .insert({ id: testId, username: 'test' })
  
  if (insertError) {
    console.log('❌ Cannot insert profile:', insertError.message)
    console.log('   This suggests RLS or permission issues')
  } else {
    console.log('✅ Manual profile creation works')
    await supabase.from('profiles').delete().eq('id', testId)
  }
  
  console.log('\n📋 RECOMMENDATIONS:')
  console.log('─'.repeat(50))
  
  const missingProfiles = recentGoogleUsers.filter(async u => {
    const { data } = await supabase.from('profiles').select('id').eq('id', u.id).single()
    return !data
  })
  
  if (missingProfiles.length > 0) {
    console.log('⚠️  Some Google users are missing profiles')
    console.log('   → Database trigger may not be working')
    console.log('   → Need to check/recreate trigger')
  } else {
    console.log('✅ All recent Google users have profiles')
    console.log('   → Trigger appears to be working')
  }
  
  console.log('\nNext steps:')
  console.log('1. Test Google OAuth login in browser')
  console.log('2. Check browser console for errors')
  console.log('3. Check Supabase logs for auth errors')
}

checkSetup().catch(console.error)
