// Script to check current tasks table schema
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('🔍 Checking current tasks table schema...\n');

  try {
    // Get a sample task to see all columns
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }

    if (data && data.length > 0) {
      console.log('Current columns in tasks table:');
      Object.keys(data[0]).sort().forEach(col => {
        console.log(`  - ${col}`);
      });
    } else {
      console.log('No tasks found in database. Creating a test query to check schema...');
      
      // Try to insert and immediately delete to see what columns exist
      const { error: schemaError } = await supabase
        .from('tasks')
        .select('task_id, start_time, end_time, is_critical')
        .limit(0);
      
      if (schemaError) {
        console.log('\nSchema check error:', schemaError.message);
      }
    }
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

checkSchema();
