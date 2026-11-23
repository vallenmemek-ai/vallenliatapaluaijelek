import { NextResponse } from 'next/server';
import { listKeys, createKey, stats } from '@/lib/store';
import { isAdmin } from '@/lib/auth';

export async function GET() {
  if (!isAdmin()) return NextResponse.json({ ok: false }, { status: 401 });
  const [keys, s] = await Promise.all([listKeys(), stats()]);
  return NextResponse.json({ keys, stats: s });
}

export async function POST(req) {
  if (!isAdmin()) return NextResponse.json({ ok: false }, { status: 401 });
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const label = (body || {}).label || '';
  const customKey = (body || {}).customKey || '';
  let days = parseInt((body || {}).days, 10);
  if (![1, 7, 30].includes(days)) days = 7;
  let maxDevice = parseInt((body || {}).maxDevice, 10);
  if (!Number.isFinite(maxDevice) || maxDevice < 1) maxDevice = 1;
  if (maxDevice > 999) maxDevice = 999;
  try {
    const row = await createKey({ label, days, key: customKey || undefined, maxDevice });
    return NextResponse.json({ ok: true, key: row.key, id: row.id, exp: Number(row.exp), max_device: maxDevice });
  } catch (e) {
    const reason = e.message === 'duplicate_key' ? 'duplicate_key' : 'invalid_key';
    return NextResponse.json({ ok: false, reason }, { status: 400 });
  }
}
