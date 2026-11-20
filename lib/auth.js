import crypto from 'crypto';
import { cookies } from 'next/headers';

const SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me';
export const COOKIE = 'vallen_sess';
const TTL = 7 * 24 * 60 * 60 * 1000; // 7 hari

export function adminPassword() {
  return process.env.ADMIN_PASSWORD || 'vallen123';
}

function sign(data) {
  return crypto.createHmac('sha256', SECRET).update(data).digest('hex');
}

export function makeToken() {
  const exp = Date.now() + TTL;
  const payload = `admin.${exp}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token) {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [who, exp, sig] = parts;
  const payload = `${who}.${exp}`;
  if (sign(payload) !== sig) return false;
  if (Number(exp) < Date.now()) return false;
  return who === 'admin';
}

export function isAdmin() {
  try { return verifyToken(cookies().get(COOKIE)?.value); } catch { return false; }
}
