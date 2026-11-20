import { NextResponse } from 'next/server';
import { listActivity } from '@/lib/store';
import { isAdmin } from '@/lib/auth';

export async function GET() {
  if (!isAdmin()) return NextResponse.json({ ok: false }, { status: 401 });
  const activity = await listActivity(100);
  return NextResponse.json({ activity });
}
