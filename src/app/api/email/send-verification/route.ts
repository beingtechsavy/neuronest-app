import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'Email verification is handled by Supabase Auth.' }, { status: 410 });
}
