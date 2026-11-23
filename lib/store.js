import fs from 'fs';
import path from 'path';
import { generateKeyString, hashKey } from './keys.js';

const USE_PG = !!(process.env.POSTGRES_URL || process.env.DATABASE_URL);
const DATA_DIR = path.join(process.cwd(), 'data');
const KEYS_FILE = path.join(DATA_DIR, 'keys.json');
const ACT_FILE = path.join(DATA_DIR, 'activity.json');

// ───────────────────────────────────────────────────────────
//  POSTGRES BACKEND
// ───────────────────────────────────────────────────────────
let pool = null;
let pgReady = false;
async function pg() {
  if (!pool) {
    const { createPool } = await import('@vercel/postgres');
    pool = createPool({ connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL });
  }
  const sql = pool.sql.bind(pool);
  if (!pgReady) {
    await sql`CREATE TABLE IF NOT EXISTS keys (
      id SERIAL PRIMARY KEY, key TEXT NOT NULL, key_hash TEXT UNIQUE NOT NULL,
      label TEXT, days INT, exp BIGINT, device_id TEXT,
      status TEXT DEFAULT 'active', created_at BIGINT, last_seen BIGINT)`;
    await sql`CREATE TABLE IF NOT EXISTS activity (
      id SERIAL PRIMARY KEY, key_id INT, action TEXT, device_id TEXT, ip TEXT, ts BIGINT)`;
    // multi-device
    await sql`ALTER TABLE keys ADD COLUMN IF NOT EXISTS max_device INT DEFAULT 1`;
    await sql`CREATE TABLE IF NOT EXISTS key_devices (
      id SERIAL PRIMARY KEY, key_id INT NOT NULL, device_id TEXT NOT NULL,
      first_seen BIGINT, last_seen BIGINT)`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_keydev ON key_devices(key_id, device_id)`;
    pgReady = true;
  }
  return sql;
}

// ───────────────────────────────────────────────────────────
//  JSON BACKEND (dev, tanpa database)
// ───────────────────────────────────────────────────────────
function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}
function writeJson(file, data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}
function jKeys() { return readJson(KEYS_FILE, []); }
function jAct() { return readJson(ACT_FILE, []); }

// ───────────────────────────────────────────────────────────
//  PUBLIC API (sama untuk kedua backend)
// ───────────────────────────────────────────────────────────
export async function listKeys() {
  if (USE_PG) {
    const s = await pg();
    const { rows } = await s`SELECT k.*, (SELECT COUNT(*)::int FROM key_devices d WHERE d.key_id = k.id) AS device_count
                             FROM keys k ORDER BY k.id DESC`;
    return rows;
  }
  return jKeys().map(k => ({ ...k, device_count: (k.devices || []).length }))
                .sort((a, b) => b.id - a.id);
}

export async function createKey({ label, days, key: customKey, maxDevice }) {
  const max = Number(maxDevice) > 0 ? Math.min(Number(maxDevice), 999) : 1;
  let key;
  if (customKey) {
    key = String(customKey).trim().toUpperCase();
    if (!/^[A-Z0-9-]{4,40}$/.test(key)) throw new Error('invalid_key');
    if (await findByHash(hashKey(key))) throw new Error('duplicate_key');
  } else {
    do { key = generateKeyString(); } while (await findByHash(hashKey(key)));
  }
  const row = {
    key, key_hash: hashKey(key), label: label || 'Tanpa label',
    days, exp: Date.now() + days * 86400000, device_id: null,
    status: 'active', created_at: Date.now(), last_seen: null,
    max_device: max, devices: [],
  };
  if (USE_PG) {
    const s = await pg();
    const { rows } = await s`INSERT INTO keys (key,key_hash,label,days,exp,device_id,status,created_at,last_seen,max_device)
      VALUES (${row.key},${row.key_hash},${row.label},${row.days},${row.exp},NULL,'active',${row.created_at},NULL,${max}) RETURNING *`;
    await addActivity({ key_id: rows[0].id, action: 'generate', device_id: null, ip: null });
    return rows[0];
  }
  const keys = jKeys();
  row.id = keys.length ? Math.max(...keys.map(k => k.id)) + 1 : 1;
  keys.push(row);
  writeJson(KEYS_FILE, keys);
  await addActivity({ key_id: row.id, action: 'generate', device_id: null, ip: null });
  return row;
}

export async function revokeKey(id) {
  if (USE_PG) {
    const s = await pg();
    await s`UPDATE keys SET status='revoked' WHERE id=${id}`;
  } else {
    const keys = jKeys();
    const k = keys.find(x => x.id === Number(id));
    if (k) k.status = 'revoked';
    writeJson(KEYS_FILE, keys);
  }
  await addActivity({ key_id: Number(id), action: 'revoke', device_id: null, ip: null });
}

export async function findByHash(hash) {
  if (USE_PG) {
    const s = await pg();
    const { rows } = await s`SELECT * FROM keys WHERE key_hash=${hash} LIMIT 1`;
    return rows[0] || null;
  }
  return jKeys().find(k => k.key_hash === hash) || null;
}

export async function bindDevice(id, device_id) {
  if (USE_PG) {
    const s = await pg();
    await s`UPDATE keys SET device_id=${device_id}, last_seen=${Date.now()} WHERE id=${id}`;
  } else {
    const keys = jKeys();
    const k = keys.find(x => x.id === Number(id));
    if (k) { k.device_id = device_id; k.last_seen = Date.now(); }
    writeJson(KEYS_FILE, keys);
  }
}

// ── multi-device: daftar device kalau masih ada slot ──
// return { ok:true } | { ok:false, count, max }
export async function registerDevice(keyId, deviceId, maxDevice) {
  const max = Number(maxDevice) > 0 ? Math.min(Number(maxDevice), 999) : 1;
  const now = Date.now();

  if (USE_PG) {
    const s = await pg();
    const { rows: ex } = await s`SELECT id FROM key_devices WHERE key_id=${keyId} AND device_id=${deviceId} LIMIT 1`;
    if (ex.length) {
      await s`UPDATE key_devices SET last_seen=${now} WHERE id=${ex[0].id}`;
      await s`UPDATE keys SET device_id=${deviceId}, last_seen=${now} WHERE id=${keyId}`;
      return { ok: true };
    }
    const { rows: c } = await s`SELECT COUNT(*)::int AS n FROM key_devices WHERE key_id=${keyId}`;
    const n = c[0] ? c[0].n : 0;
    if (n >= max) return { ok: false, count: n, max };
    await s`INSERT INTO key_devices (key_id,device_id,first_seen,last_seen) VALUES (${keyId},${deviceId},${now},${now})`;
    await s`UPDATE keys SET device_id=${deviceId}, last_seen=${now} WHERE id=${keyId}`;
    return { ok: true };
  }

  const keys = jKeys();
  const k = keys.find(x => x.id === Number(keyId));
  if (!k) return { ok: false, count: 0, max };
  k.devices = k.devices || [];
  const ex = k.devices.find(d => d.device_id === deviceId);
  if (ex) {
    ex.last_seen = now; k.device_id = deviceId; k.last_seen = now;
    writeJson(KEYS_FILE, keys);
    return { ok: true };
  }
  if (k.devices.length >= max) return { ok: false, count: k.devices.length, max };
  k.devices.push({ device_id: deviceId, first_seen: now, last_seen: now });
  k.device_id = deviceId; k.last_seen = now;
  writeJson(KEYS_FILE, keys);
  return { ok: true };
}

export async function listDevices(keyId) {
  if (USE_PG) {
    const s = await pg();
    const { rows } = await s`SELECT device_id, first_seen, last_seen FROM key_devices WHERE key_id=${keyId} ORDER BY id`;
    return rows;
  }
  const k = jKeys().find(x => x.id === Number(keyId));
  return k ? (k.devices || []) : [];
}

export async function resetDevice(id) {
  if (USE_PG) {
    const s = await pg();
    await s`UPDATE keys SET device_id=NULL, last_seen=NULL WHERE id=${id}`;
    await s`DELETE FROM key_devices WHERE key_id=${id}`;
  } else {
    const keys = jKeys();
    const k = keys.find(x => x.id === Number(id));
    if (k) { k.device_id = null; k.last_seen = null; k.devices = []; }
    writeJson(KEYS_FILE, keys);
  }
  await addActivity({ key_id: Number(id), action: 'reset_device', device_id: null, ip: null });
}

export async function touchSeen(id) {
  if (USE_PG) {
    const s = await pg();
    await s`UPDATE keys SET last_seen=${Date.now()} WHERE id=${id}`;
  } else {
    const keys = jKeys();
    const k = keys.find(x => x.id === Number(id));
    if (k) k.last_seen = Date.now();
    writeJson(KEYS_FILE, keys);
  }
}

export async function addActivity({ key_id, action, device_id, ip }) {
  const row = { key_id, action, device_id: device_id || null, ip: ip || null, ts: Date.now() };
  if (USE_PG) {
    const s = await pg();
    await s`INSERT INTO activity (key_id,action,device_id,ip,ts) VALUES (${key_id},${action},${row.device_id},${row.ip},${row.ts})`;
    return;
  }
  const act = jAct();
  row.id = act.length ? Math.max(...act.map(a => a.id)) + 1 : 1;
  act.push(row);
  writeJson(ACT_FILE, act.slice(-500));
}

export async function listActivity(limit = 100) {
  if (USE_PG) {
    const s = await pg();
    const { rows } = await s`SELECT * FROM activity ORDER BY id DESC LIMIT ${limit}`;
    return rows;
  }
  return jAct().sort((a, b) => b.id - a.id).slice(0, limit);
}

export async function stats() {
  const keys = await listKeys();
  const now = Date.now();
  const c = { active: 0, expired: 0, revoked: 0, total: keys.length };
  for (const k of keys) {
    if (k.status === 'revoked') c.revoked++;
    else if (Number(k.exp) < now) c.expired++;
    else c.active++;
  }
  return c;
}
