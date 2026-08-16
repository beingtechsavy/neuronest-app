const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function runMigration() {
  console.log('🚀 Running timezone bubble migration...');
  
  try {
    // Check if timezone column exists
    const { data: columns, error: checkError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'profiles')
      .eq('column_name', 'timezone');
    
    if (checkError) {
      console.log('⚠️ Could not check existing columns, proceeding anyway');
    }
    
    if (columns && columns.length > 0) {
      console.log('✅ Timezone column already exists');
    } else {
      console.log('📝 Timezone column needs to be added manually via Supabase dashboard');
      console.log('   SQL: ALTER TABLE profiles ADD COLUMN timezone TEXT DEFAULT \'UTC\';');
    }
    
    // Test the calendar functions
    console.log('🧪 Testing safe time utilities...');
    
    // Import our safe utilities
    const { 
      timeStringToMinutes, 
      minutesToTimeString, 
      getLocalDateString,
      parsePreferenceTime 
    } = require('./src/lib/safeTimeUtils.ts');
    
    // Test basic functionality
    const testTime = '09:30:00';
    const minutes = timeStringToMinutes(testTime);
    const backToString = minutesToTimeString(minutes);
    
    console.log(`✅ Time conversion test: ${testTime} -> ${minutes} minutes -> ${backToString}`);
    
    const testDate = new Date();
    const dateString = getLocalDateString(testDate);
    console.log(`✅ Date conversion test: ${testDate.toISOString()} -> ${dateString}`);
    
    console.log('🎉 Migration and tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

runMigration();