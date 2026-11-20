'use client';
import { useState, useEffect } from 'react';
import Badge from '@/components/Badge';
import { statusOf } from '@/lib/status';

function fmt(t) { return t ? new Date(Number(t)).toLocaleString('id-ID') : '—'; }

export default function Devices() {
  const [keys, setKeys] = useState([]);
  useEffect(() => {
    fetch('/api/admin/keys').then(r => r.json()).then(d => setKeys(d.keys.map(k => ({ ...k, status: statusOf(k) }))));
  }, []);
  const bound = keys.filter(k => k.device_id);
  return (
    <div>
      <div className="page-head"><div><h2>Devices</h2><div className="desc">HP yang udah bind key (1 key = 1 device).</div></div></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Device ID</th><th>Label</th><th>Key</th><th>Last Seen</th><th>Status</th></tr></thead>
          <tbody>
            {bound.map(k => (
              <tr key={k.id}>
                <td><span className="dev">{k.device_id}</span></td>
                <td><span className="lbl">{k.label}</span></td>
                <td><span className="key">{k.key}</span></td>
                <td className="nowrap muted">{fmt(k.last_seen)}</td>
                <td><Badge status={k.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!bound.length && <div className="empty">Belum ada device yang bind key.</div>}
      </div>
    </div>
  );
}
