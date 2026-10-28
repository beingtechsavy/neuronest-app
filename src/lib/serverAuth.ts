import { NextRequest } from 'next/server';
import { createClient, User } from '@supabase/supabase-js';

let supabaseAuthClient: ReturnType<typeof createClient> | null = null;

function getAuthClient() {
  if (!supabaseAuthClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      throw new Error('Supabase configuration missing');
    }
    supabaseAuthClient = createClient(url, anonKey);
  }
  return supabaseAuthClient;
}

/**
 * Reads Authorization header (Bearer <token>) and verifies user session with Supabase auth.
 * Returns verified User object or null if unauthenticated / invalid token.
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<User | null> {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!authHeader) return null;

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  try {
    const client = getAuthClient();
    const { data: { user }, error } = await client.auth.getUser(token);
    if (error || !user) return null;
    return user;
  } catch (error) {
    console.error('Error verifying authenticated user:', error);
    return null;
  }
}
