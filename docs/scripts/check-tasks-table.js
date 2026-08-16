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

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkTasksTable() {
  console.log('🔍 Checking Tasks Table Schema...');
  console.log('');
  
  try {
    // Try to select with the missing columns to see what happens
    const { data, error } = await supabase
      .from('tasks')
      .select('task_id, title, start_time, end_time, task_status')
      .limit(1);
    
    if (error) {
      console.log('❌ Error querying tasks table:', error.message);
      
      if (error.message.includes('end_time')) {
        console.log('');
        console.log('🔧 SOLUTION: The tasks table is missing scheduling columns.');
        console.log('');
        console.log('Run this migration in Supabase SQL Editor:');
        console.log('1. Go to Supabase Dashboard → SQL Editor');
        console.log('2. Copy and paste the content of: add-task-scheduling-columns.sql');
        console.log('3. Click Run');
        console.log('');
        console.log('This will add the missing columns:');
        console.log('- start_time (for detailed scheduling)');
        console.log('- end_time (for detailed scheduling)');
        console.log('- task_status (for workflow management)');
      }
    } else {
      console.log('✅ Tasks table query successful!');
      console.log('   Found', data.length, 'task(s)');
      
      if (data.length > 0) {
        const task = data[0];
        console.log('   Sample task columns:');
        console.log('   - task_id:', task.task_id ? '✅' : '❌');
        console.log('   - title:', task.title ? '✅' : '❌');
        console.log('   - start_time:', task.start_time !== undefined ? '✅' : '❌');
        console.log('   - end_time:', task.end_time !== undefined ? '✅' : '❌');
        console.log('   - task_status:', task.task_status !== undefined ? '✅' : '❌');
      }
    }
  } catch (error) {
    console.log('❌ Failed to check tasks table:', error.message);
  }
}

async function runCheck() {
  console.log('🚀 Tasks Table Diagnostic');
  console.log('=' .repeat(40));
  
  await checkTasksTable();
  
  console.log('');
  console.log('💡 If you see missing column errors:');
  console.log('   Run the migration: add-task-scheduling-columns.sql');
  console.log('');
  console.log('✅ After migration:');
  console.log('   - Task scheduling will work');
  console.log('   - Calendar integration will work');
  console.log('   - No more "end_time" errors');
}

runCheck().catch(console.error);