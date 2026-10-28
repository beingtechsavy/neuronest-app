import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'Welcome email delivery is handled by the account email provider.' }, { status: 410 });
}
