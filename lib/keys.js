import crypto from 'crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function block(n) {
  let s = '';
  const bytes = crypto.randomBytes(n);
  for (let i = 0; i < n; i++) s += ALPHABET[bytes[i] % ALPHABET.length];
  return s;
}

export function generateKeyString() {
  return `VALLEN-FUCK-${block(4)}`;
}

export function hashKey(key) {
  return crypto.createHash('sha256').update(String(key).trim().toUpperCase()).digest('hex');
}

export function statusOf(key) {
  if (key.status === 'revoked') return 'revoked';
  if (Number(key.exp) < Date.now()) return 'expired';
  return 'active';
}
