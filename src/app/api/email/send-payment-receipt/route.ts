import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'Payment receipts are sent only after verified webhook processing.' }, { status: 410 });
}
