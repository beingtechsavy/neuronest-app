const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// The two users with data that we want to find
const ORPHANED_USERS = [
  { id: 'ba76c824-86b7-42b3-a9a3-e5f0fbb5a291', username: 'marshmallow' },
  { id: '6239aa32-64f6-43d7-ad7f-661c986b3f60', username: 'Poli' }
];

async function findDeletedUserEmails() {
  console.log('🔍 Searching for deleted user emails...\n');
  console.log('Looking for: marshmallow and Poli\n');
  console.log('═'.repeat(60));

  for (const user of ORPHANED_USERS) {
    console.log(`\n👤 User: ${user.username}`);
    console.log(`   ID: ${user.id}\n`);

    // Check if they have any subjects with email-like data
    const { data: subjects } = await supabase
      .from('subjects')
      .select('*')
      .eq('user_id', user.id);

    console.log(`   📚 Subjects: ${subjects?.length || 0}`);
    if (subjects && subjects.length > 0) {
      subjects.forEach(s => console.log(`      - ${s.title}`));
    }

    // Check tasks for any clues
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .limit(5);

    console.log(`   ✅ Tasks: ${tasks?.length || 0} (showing first 5)`);
    if (tasks && tasks.length > 0) {
      tasks.forEach(t => console.log(`      - ${t.title}`));
    }

    // Check when they last created content
    const { data: lastTask } = await supabase
      .from('tasks')
      .select('created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (lastTask && lastTask.length > 0) {
      console.log(`   📅 Last activity: ${lastTask[0].created_at}`);
    }

    // Check profile creation
    const { data: profile } = await supabase
      .from('profiles')
      .select('updated_at')
      .eq('id', user.id)
      .single();

    if (profile) {
      console.log(`   📅 Profile updated: ${profile.updated_at}`);
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('\n💡 NEXT STEPS:\n');
  console.log('1. Check your Resend email logs at: https://resend.com/emails');
  console.log('   Search for emails sent around the dates shown above');
  console.log('');
  console.log('2. Check Supabase Auth logs:');
  console.log('   - Go to Supabase Dashboard > Authentication > Logs');
  console.log('   - Look for signup events with these user IDs');
  console.log('');
  console.log('3. If you find their emails, you can:');
  console.log('   - Manually send them the newsletter');
  console.log('   - Or help them recreate their accounts and link to existing data');
  console.log('');
  console.log('4. Alternative: Keep the 19 empty profiles for now');
  console.log('   They\'re not causing harm, just taking up space');
  console.log('');
}

findDeletedUserEmails();
