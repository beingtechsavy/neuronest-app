const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Unfortunately, Supabase doesn't provide direct API access to auth audit logs
// But we can check if these users ever received welcome emails

async function searchForEmails() {
  console.log('🔍 Searching for deleted user information...\n');
  
  const ORPHANED_USERS = [
    { id: 'ba76c824-86b7-42b3-a9a3-e5f0fbb5a291', username: 'marshmallow', lastActivity: '2025-11-15' },
    { id: '6239aa32-64f6-43d7-ad7f-661c986b3f60', username: 'Poli', lastActivity: '2025-10-19' }
  ];

  console.log('📋 User Information:\n');
  console.log('1. marshmallow');
  console.log('   - Last active: November 15, 2025');
  console.log('   - Dutch student (subjects in Dutch)');
  console.log('   - 6 subjects, 31 tasks');
  console.log('   - Profile created: October 19, 2025');
  console.log('');
  console.log('2. Poli');
  console.log('   - Last active: October 19, 2025');
  console.log('   - 1 subject (health), 7 tasks');
  console.log('   - Profile created: October 19, 2025');
  console.log('');
  
  console.log('═'.repeat(60));
  console.log('\n🔎 WHERE TO FIND THEIR EMAILS:\n');
  
  console.log('1. Resend Dashboard (Most Likely):');
  console.log('   🌐 https://resend.com/emails');
  console.log('   - Filter by date: October 19 - November 15, 2025');
  console.log('   - Look for welcome emails sent to these users');
  console.log('   - Search for "marshmallow" or "Poli" in recipient names');
  console.log('');
  
  console.log('2. Supabase Auth Logs:');
  console.log('   🌐 https://supabase.com/dashboard/project/[your-project]/auth/users');
  console.log('   - Click "Logs" tab');
  console.log('   - Filter by these user IDs:');
  console.log('     • ba76c824-86b7-42b3-a9a3-e5f0fbb5a291 (marshmallow)');
  console.log('     • 6239aa32-64f6-43d7-ad7f-661c986b3f60 (Poli)');
  console.log('');
  
  console.log('3. Check if you have email logs stored:');
  console.log('   - Do you have a table tracking sent emails?');
  console.log('   - Check your server logs around those dates');
  console.log('');
  
  console.log('═'.repeat(60));
  console.log('\n💡 MANUAL WORKAROUND:\n');
  console.log('If you can\'t find their emails, you have options:\n');
  console.log('Option A: Wait for them to return');
  console.log('   - Keep their data intact');
  console.log('   - They might try to log in again');
  console.log('   - Show them a "recover account" option');
  console.log('');
  console.log('Option B: Add email field to profiles table');
  console.log('   - Store email in profiles as backup');
  console.log('   - Prevents this issue in future');
  console.log('   - Can\'t help with current users though');
  console.log('');
  console.log('Option C: Clean up only the 19 empty profiles');
  console.log('   - Keep marshmallow and Poli\'s data');
  console.log('   - They represent real users who might return');
  console.log('');
  
  console.log('═'.repeat(60));
  console.log('\n📊 CURRENT STATUS:\n');
  console.log('✅ Newsletter sent to: 50 active users');
  console.log('⚠️  Unable to reach: 2 users (marshmallow, Poli)');
  console.log('🗑️  Can clean up: 19 empty orphaned profiles');
  console.log('');
}

searchForEmails();
