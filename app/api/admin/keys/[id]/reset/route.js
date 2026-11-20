import { NextResponse } from 'next/server';
import { resetDevice } from '@/lib/store';
import { isAdmin } from '@/lib/auth';

export async function POST(req, { params }) {
  if (!isAdmin()) return NextResponse.json({ ok: false }, { status: 401 });
  await resetDevice(params.id);
  return NextResponse.json({ ok: true });
}
