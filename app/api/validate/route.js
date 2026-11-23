import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { findByHash, registerDevice, touchSeen, addActivity } from '@/lib/store';
import { hashKey } from '@/lib/keys';

// HMAC secret — harus sama dengan K1^K2 di client (src/protect/guard.hpp).
// Override lewat env VALLEN_HMAC_SECRET kalau mau rotate.
const HMAC_SECRET = Buffer.from(
  process.env.VALLEN_HMAC_SECRET ||
  'f439fc4cfb6f86ea5175878aaf5876c7d2730baedd8c214007a47ca649f7869f',
  'hex'
);

// payload tanda tangan: key|device|expires|ok  (harus identik dengan client)
function sign(key, device_id, expires_at) {
  const payload = `${key}|${device_id}|${expires_at}|1`;
  return crypto.createHmac('sha256', HMAC_SECRET).update(payload).digest('hex');
}

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

  // multi-device: daftar kalau masih ada slot (max_device)
  const reg = await registerDevice(k.id, device_id, k.max_device || 1);
  if (!reg.ok) {
    await addActivity({ key_id: k.id, action: 'device_limit', device_id, ip });
    return NextResponse.json({
      ok: false, reason: 'device_limit',
      devices: reg.count, max_device: reg.max,
    });
  }
  await touchSeen(k.id);
  await addActivity({ key_id: k.id, action: 'validate', device_id, ip });

  return NextResponse.json({
    ok: true,
    expires_at: Number(k.exp),
    label: k.label,
    max_device: Number(k.max_device || 1),
    sig: sign(key, device_id, Number(k.exp)),
  });
}
