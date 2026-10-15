import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'Password reset email is handled by Supabase Auth.' }, { status: 410 });
}
