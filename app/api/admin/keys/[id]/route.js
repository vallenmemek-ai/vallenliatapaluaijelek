import { NextResponse } from 'next/server';
import { revokeKey } from '@/lib/store';
import { isAdmin } from '@/lib/auth';

export async function DELETE(req, { params }) {
  if (!isAdmin()) return NextResponse.json({ ok: false }, { status: 401 });
  await revokeKey(params.id);
  return NextResponse.json({ ok: true });
}
