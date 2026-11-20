export function statusOf(k) {
  if (k.status === 'revoked') return 'revoked';
  if (Number(k.exp) < Date.now()) return 'expired';
  return 'active';
}
