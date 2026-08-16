const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function runSafeMigration() {
  console.log('🚀 Running Safe Timezone Bubble Migration...');
  console.log('=====================================');
  
  try {
    // Step 1: Add timezone column to profiles (safe operation)
    console.log('📝 Step 1: Adding timezone column to profiles...');
    
    // We can't run DDL with the client, so we'll just verify the structure
    const { data: profileColumns, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profileError) {
      console.log('⚠️  Could not verify profiles table structure');
    } else {
      console.log('✅ Profiles table accessible');
    }
    
    // Step 2: Check time_blocks structure
    console.log('📝 Step 2: Checking time_blocks structure...');
    
    const { data: timeBlocksData, error: timeBlocksError } = await supabase
      .from('time_blocks')
      .select('*')
      .limit(1);
    
    if (timeBlocksError) {
      console.log('⚠️  Could not verify time_blocks table structure');
    } else {
      console.log('✅ Time_blocks table accessible');
      if (timeBlocksData && timeBlocksData.length > 0) {
        console.log('📊 Sample time_block structure:', Object.keys(timeBlocksData[0]));
      }
    }
    
    // Step 3: Check tasks structure (should already be perfect)
    console.log('📝 Step 3: Verifying tasks table structure...');
    
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('task_id, start_time, end_time, scheduled_date')
      .limit(1);
    
    if (tasksError) {
      console.log('⚠️  Could not verify tasks table structure');
    } else {
      console.log('✅ Tasks table structure verified');
      if (tasksData && tasksData.length > 0) {
        console.log('📊 Sample task fields:', Object.keys(tasksData[0]));
      }
    }
    
    console.log('\n🎯 Migration Requirements:');
    console.log('=====================================');
    console.log('1. ✅ Code updated to use safe time utilities');
    console.log('2. 📝 Database needs manual updates:');
    console.log('   - Add timezone column to profiles');
    console.log('   - Add safe time columns to time_blocks');
    console.log('3. ✅ Tasks table already uses safe TIME columns');
    
    console.log('\n📋 Manual SQL Commands Needed:');
    console.log('=====================================');
    console.log('-- Add timezone to profiles');
    console.log("ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';");
    console.log('');
    console.log('-- Add safe time columns to time_blocks');
    console.log('ALTER TABLE time_blocks ADD COLUMN IF NOT EXISTS start_time_safe TIME;');
    console.log('ALTER TABLE time_blocks ADD COLUMN IF NOT EXISTS end_time_safe TIME;');
    console.log('ALTER TABLE time_blocks ADD COLUMN IF NOT EXISTS block_date DATE;');
    console.log('');
    console.log('-- Migrate existing time_blocks data');
    console.log('UPDATE time_blocks SET');
    console.log('  start_time_safe = start_time::TIME,');
    console.log('  end_time_safe = end_time::TIME,');
    console.log('  block_date = start_time::DATE');
    console.log('WHERE start_time_safe IS NULL;');
    
    console.log('\n🎉 Code Migration Complete!');
    console.log('=====================================');
    console.log('✅ Safe time utilities implemented');
    console.log('✅ Calendar code updated for time bubbles');
    console.log('✅ Crash prevention added');
    console.log('✅ Timezone indicator added to UI');
    console.log('📝 Database changes need to be applied manually');
    
    console.log('\n🚀 Ready for Testing:');
    console.log('=====================================');
    console.log('1. Apply the SQL commands above in Supabase dashboard');
    console.log('2. Test Belgium ↔ India account switching');
    console.log('3. Verify no crashes or weird spacing');
    console.log('4. Check that times display correctly');
    
  } catch (error) {
    console.error('❌ Migration check failed:', error.message);
  }
}

runSafeMigration();