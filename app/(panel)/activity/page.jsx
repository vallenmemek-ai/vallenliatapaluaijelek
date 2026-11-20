'use client';
import { useState, useEffect } from 'react';

const actionColor = { validate: 'active', generate: 'active', revoke: 'revoked', validate_invalid: 'expired', device_mismatch: 'expired' };

export default function Activity() {
  const [act, setAct] = useState([]);
  useEffect(() => {
    fetch('/api/admin/activity').then(r => r.json()).then(d => setAct(d.activity));
  }, []);
  return (
    <div>
      <div className="page-head"><div><h2>Activity</h2><div className="desc">Log validasi, generate, dan revoke key.</div></div></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Waktu</th><th>Aksi</th><th>Key ID</th><th>Device</th><th>IP</th></tr></thead>
          <tbody>
            {act.map(a => (
              <tr key={a.id}>
                <td className="nowrap muted">{new Date(Number(a.ts)).toLocaleString('id-ID')}</td>
                <td><span className={`badge ${actionColor[a.action] || 'active'}`}><span className="dot" />{a.action}</span></td>
                <td className="mono">{a.key_id ?? '—'}</td>
                <td><span className="dev">{a.device_id || '—'}</span></td>
                <td><span className="dev">{a.ip || '—'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!act.length && <div className="empty">Belum ada aktivitas.</div>}
      </div>
    </div>
  );
}
