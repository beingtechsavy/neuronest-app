// Manual Premium Account Activation Script
// Run this with: node activate-premium-accounts.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // You'll need this for admin operations
);

async function activatePremiumAccount(email) {
  try {
    console.log(`Activating premium for: ${email}`);
    
    // First, get the user ID
    const { data: user, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) throw userError;
    
    const targetUser = user.users.find(u => u.email === email);
    if (!targetUser) {
      console.log(`User not found: ${email}`);
      return;
    }
    
    console.log(`Found user ID: ${targetUser.id}`);
    
    // Update or insert usage limits
    const { data, error } = await supabase
      .from('usage_limits')
      .upsert({
        user_id: targetUser.id,
        plan_type: 'premium',
        breakdowns_limit: 999999,
        flashcards_limit: 999999,
        subjects_limit: 999999,
        breakdowns_used: 0,
        flashcards_used: 0,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });
    
    if (error) {
      console.error(`Error activating premium for ${email}:`, error);
    } else {
      console.log(`✅ Premium activated for ${email}`);
    }
    
  } catch (error) {
    console.error(`Failed to activate premium for ${email}:`, error);
  }
}

async function main() {
  // Replace these with actual email addresses
  const emailsToActivate = [
    'your-email@example.com',
    'girlfriend-email@example.com'
  ];
  
  console.log('Starting premium activation...');
  
  for (const email of emailsToActivate) {
    await activatePremiumAccount(email);
  }
  
  console.log('Done!');
}

main().catch(console.error);