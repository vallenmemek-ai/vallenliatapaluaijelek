'use client';
import { useState } from 'react';
import s from './settings.module.css';

export default function Settings() {
  const [key, setKey] = useState('');
  const [device, setDevice] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  async function test() {
    setBusy(true); setResult(null);
    const res = await fetch('/api/validate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, device_id: device || 'test-device' }),
    });
    setResult(await res.json());
    setBusy(false);
  }

  const endpoint = typeof window !== 'undefined' ? `${window.location.origin}/api/validate` : '/api/validate';

  return (
    <div>
      <div className="page-head"><div><h2>Settings</h2><div className="desc">Konfigurasi & integrasi mod VALLEN.</div></div></div>

      <div className={s.grid}>
        <div className={s.card}>
          <h3>Test Validasi Key</h3>
          <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>Simulasi mod validasi key ke API.</p>
          <div className="field"><label>Key</label><input value={key} onChange={e => setKey(e.target.value)} placeholder="VALLEN-XXXX-XXXX-XXXX" /></div>
          <div className="field"><label>Device ID</label><input value={device} onChange={e => setDevice(e.target.value)} placeholder="android_id HP" /></div>
          <button className="btn btn-pink" onClick={test} disabled={busy || !key}>{busy ? '…' : 'Test Validate'}</button>
          {result && <pre className={`${s.result} ${result.ok ? s.ok : s.bad}`}>{JSON.stringify(result, null, 2)}</pre>}
        </div>

        <div className={s.card}>
          <h3>Integrasi Mod</h3>
          <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>Mod kirim POST ke endpoint ini pas start:</p>
          <code className={s.code}>{endpoint}</code>
          <pre className={s.snippet}>{`POST /api/validate
{ "key": "VALLEN-...", "device_id": "<android_id>" }

Response:
{ "ok": true, "expires_at": 1735689600000 }`}</pre>
          <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>Reason kalau gagal: <span className="mono">invalid / expired / revoked / device_mismatch / rate_limited</span>.</p>
        </div>

        <div className={s.card}>
          <h3>Environment</h3>
          <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>Di-set di Vercel dashboard (atau <span className="mono">.env.local</span> buat dev):</p>
          <ul className={s.env}>
            <li><span className="mono">ADMIN_PASSWORD</span> — password login admin</li>
            <li><span className="mono">SESSION_SECRET</span> — secret sign cookie</li>
            <li><span className="mono">POSTGRES_URL</span> — Vercel Postgres (kosong = JSON lokal)</li>
          </ul>
          <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>Ganti password & secret di production. Jangan pakai default.</p>
        </div>
      </div>
    </div>
  );
}
