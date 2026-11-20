import { NextResponse } from 'next/server';
import { adminPassword, makeToken, COOKIE } from '@/lib/auth';

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  if ((body || {}).password !== adminPassword()) {
    return NextResponse.json({ ok: false, reason: 'wrong_password' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, makeToken(), {
    httpOnly: true, sameSite: 'lax', path: '/',
    maxAge: 7 * 24 * 60 * 60, secure: process.env.NODE_ENV === 'production',
  });
  return res;
}
