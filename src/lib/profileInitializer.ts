/**
 * Unified Profile Initialization System
 * Handles race conditions between auth callback and profile creation
 */

import { SupabaseClient } from '@supabase/supabase-js';

interface ProfileData {
  id: string;
  username?: string | null;
}

interface InitOptions {
  maxRetries?: number;
  retryDelay?: number;
  createIfMissing?: boolean;
}

/**
 * Ensures a user profile exists with retry logic
 * Handles race conditions between trigger-based and manual profile creation
 */
export async function ensureProfileExists(
  supabase: SupabaseClient,
  userId: string,
  options: InitOptions = {}
): Promise<ProfileData | null> {
  const {
    maxRetries = 5,
    retryDelay = 500,
    createIfMissing = true,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Try to fetch existing profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('id', userId)
        .single();

      if (profile) {
        console.log(`✅ Profile found for user ${userId} (attempt ${attempt + 1})`);
        return profile;
      }

      // Profile doesn't exist yet
      if (error?.code === 'PGRST116') {
        console.log(`⏳ Profile not found yet (attempt ${attempt + 1}/${maxRetries})`);
        
        // On first attempt, try to create it manually if allowed
        if (attempt === 0 && createIfMissing) {
          const created = await createProfileManually(supabase, userId);
          if (created) {
            return created;
          }
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries - 1) {
          await sleep(retryDelay * Math.pow(1.5, attempt));
          continue;
        }
      }

      // Other errors
      if (error) {
        console.error(`❌ Profile fetch error:`, error);
        lastError = new Error(error.message);
      }

    } catch (err) {
      console.error(`💥 Profile check exception:`, err);
      lastError = err instanceof Error ? err : new Error('Unknown error');
    }
  }

  // All retries exhausted
  console.error(`❌ Failed to ensure profile exists after ${maxRetries} attempts`);
  
  if (lastError) {
    throw lastError;
  }

  return null;
}

/**
 * Manually creates a profile if the database trigger failed
 */
async function createProfileManually(
  supabase: SupabaseClient,
  userId: string
): Promise<ProfileData | null> {
  try {
    console.log(`🔧 Attempting manual profile creation for ${userId}`);

    // Get user metadata
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Failed to get user data:', userError);
      return null;
    }

    // Extract username from email
    const username = user.email?.split('@')[0] || 'User';

    // Insert profile
    const { data: profile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        username: username,
      })
      .select()
      .single();

    if (insertError) {
      // Check if it's a duplicate (trigger created it meanwhile)
      if (insertError.code === '23505') {
        console.log('✅ Profile already exists (created by trigger)');
        // Fetch the existing profile
        const { data: existing } = await supabase
          .from('profiles')
          .select('id, username')
          .eq('id', userId)
          .single();
        return existing;
      }

      console.error('❌ Manual profile creation failed:', insertError);
      return null;
    }

    console.log('✅ Profile created manually');
    return profile;

  } catch (err) {
    console.error('💥 Manual profile creation exception:', err);
    return null;
  }
}

/**
 * Initializes all user-related data (profile, usage limits, preferences)
 */
export async function initializeUserData(
  supabase: SupabaseClient,
  userId: string
): Promise<{ success: boolean; profile: ProfileData | null }> {
  try {
    // Ensure profile exists first
    const profile = await ensureProfileExists(supabase, userId);

    if (!profile) {
      return { success: false, profile: null };
    }

    // Initialize usage limits if missing (non-blocking)
    initializeUsageLimits(supabase, userId).catch(err => {
      console.error('Failed to initialize usage limits:', err);
    });

    return { success: true, profile };

  } catch (err) {
    console.error('User data initialization failed:', err);
    return { success: false, profile: null };
  }
}

/**
 * Ensures usage limits exist for the user
 */
async function initializeUsageLimits(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  try {
    const { data: existing } = await supabase
      .from('usage_limits')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      return; // Already exists
    }

    // Create default usage limits
    await supabase.from('usage_limits').insert({
      user_id: userId,
      plan_type: 'free',
      breakdowns_used: 0,
      breakdowns_limit: 3,
      flashcards_used: 0,
      flashcards_limit: 0,
      subjects_limit: 3,
      reset_date: new Date().toISOString().split('T')[0],
    });

    console.log('✅ Usage limits initialized');
  } catch (err) {
    console.error('Usage limits initialization error:', err);
  }
}

/**
 * Helper function for delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
