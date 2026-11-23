-- VALLEN Admin — Vercel Postgres schema
-- Jalanin otomatis oleh app, atau manual di Vercel Postgres Query tab.

CREATE TABLE IF NOT EXISTS keys (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL,
  key_hash TEXT UNIQUE NOT NULL,
  label TEXT,
  days INT,
  exp BIGINT,
  device_id TEXT,
  max_device INT DEFAULT 1,
  status TEXT DEFAULT 'active',
  created_at BIGINT,
  last_seen BIGINT
);

-- multi-device: satu key bisa dipakai N device (max_device)
CREATE TABLE IF NOT EXISTS key_devices (
  id SERIAL PRIMARY KEY,
  key_id INT NOT NULL,
  device_id TEXT NOT NULL,
  first_seen BIGINT,
  last_seen BIGINT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_keydev ON key_devices(key_id, device_id);

CREATE TABLE IF NOT EXISTS activity (
  id SERIAL PRIMARY KEY,
  key_id INT,
  action TEXT,
  device_id TEXT,
  ip TEXT,
  ts BIGINT
);

CREATE INDEX IF NOT EXISTS idx_keys_hash ON keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_activity_ts ON activity(ts DESC);
