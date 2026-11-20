import { NextResponse } from 'next/server';
import { findByHash, bindDevice, touchSeen, addActivity } from '@/lib/store';
import { hashKey } from '@/lib/keys';

// rate-limit sederhana per IP (in-memory)
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter(t => now - t < 60000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 30; // 30 req/menit
}

export async function POST(req) {
  const ip = req.headers.get('x-forwarded-for') || 'local';
  if (limited(ip)) return NextResponse.json({ ok: false, reason: 'rate_limited' }, { status: 429 });

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, reason: 'bad_request' }, { status: 400 }); }
  const { key, device_id } = body || {};
  if (!key || !device_id) return NextResponse.json({ ok: false, reason: 'missing_fields' }, { status: 400 });

  const k = await findByHash(hashKey(key));
  if (!k) {
    await addActivity({ key_id: null, action: 'validate_invalid', device_id, ip });
    return NextResponse.json({ ok: false, reason: 'invalid' });
  }
  if (k.status === 'revoked') return NextResponse.json({ ok: false, reason: 'revoked' });
  if (Number(k.exp) < Date.now()) return NextResponse.json({ ok: false, reason: 'expired' });
  if (k.device_id && k.device_id !== device_id) {
    await addActivity({ key_id: k.id, action: 'device_mismatch', device_id, ip });
    return NextResponse.json({ ok: false, reason: 'device_mismatch' });
  }
  if (!k.device_id) await bindDevice(k.id, device_id);
  else await touchSeen(k.id);
  await addActivity({ key_id: k.id, action: 'validate', device_id, ip });

  return NextResponse.json({ ok: true, expires_at: Number(k.exp), label: k.label });
}
