'use client';
import { useState, useEffect, useCallback } from 'react';
import KeysTable from '@/components/KeysTable';
import Toast from '@/components/Toast';
import { statusOf } from '@/lib/status';
import s from './dashboard.module.css';

export default function Dashboard() {
  const [keys, setKeys] = useState([]);
  const [stats, setStats] = useState({ active: 0, expired: 0, revoked: 0, total: 0 });
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [dur, setDur] = useState(7);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/keys');
    if (!res.ok) return;
    const data = await res.json();
    setKeys(data.keys.map(k => ({ ...k, status: statusOf(k) })));
    setStats(data.stats);
  }, []);

  useEffect(() => { load(); }, [load]);

  function showToast(m) { setToast(m); setTimeout(() => setToast(''), 2600); }
  function copy(t) { navigator.clipboard?.writeText(t); showToast('Key disalin'); }
  async function revoke(id) {
    await fetch(`/api/admin/keys/${id}`, { method: 'DELETE' });
    showToast('Key di-revoke'); load();
  }
  async function reset(id) {
    await fetch(`/api/admin/keys/${id}/reset`, { method: 'POST' });
    showToast('Device di-reset (unbind)'); load();
  }

  async function generate() {
    setBusy(true);
    const res = await fetch('/api/admin/keys', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: name || 'Key baru', days: dur, customKey: name }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.ok) {
      setName(''); load();
      navigator.clipboard?.writeText(data.key);
      showToast('Key jadi + disalin: ' + data.key);
    } else showToast(data.reason === 'duplicate_key' ? 'Key udah ada' : 'Format key invalid');
  }

  const list = keys.filter(k =>
    (filter === 'all' || k.status === filter) &&
    (k.key.toLowerCase().includes(q.toLowerCase()) || (k.label || '').toLowerCase().includes(q.toLowerCase())));

  return (
    <div>
      <div className="page-head">
        <div><h2>License Keys</h2><div className="desc">Klik Generate — key langsung jadi + ke-copy.</div></div>
        <div className={s.genbar}>
          <input className={s.nameInput} value={name} onChange={e => setName(e.target.value.toUpperCase())}
            placeholder="nama key (opsional)" onKeyDown={e => { if (e.key === 'Enter') generate(); }} />
          <select className={s.durSelect} value={dur} onChange={e => setDur(+e.target.value)}>
            <option value={1}>1 hari</option>
            <option value={7}>7 hari</option>
            <option value={30}>30 hari</option>
          </select>
          <button className="btn btn-pink" onClick={generate} disabled={busy}>{busy ? '…' : '+ Generate'}</button>
        </div>
      </div>

      <div className="metrics">
        <div className="metric"><div className="v green">{stats.active}</div><div className="l">Active</div></div>
        <div className="metric"><div className="v amber">{stats.expired}</div><div className="l">Expired</div></div>
        <div className="metric"><div className="v red">{stats.revoked}</div><div className="l">Revoked</div></div>
        <div className="metric"><div className="v">{stats.total}</div><div className="l">Total</div></div>
      </div>

      <div className={s.toolbar}>
        <div className={s.filters}>
          {['all', 'active', 'expired', 'revoked'].map(f => (
            <button key={f} className={`pill ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'all' ? 'Semua' : f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className={s.search}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
          <input placeholder="Cari key / label…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </div>

      <KeysTable keys={list} onRevoke={revoke} onCopy={copy} onReset={reset} />
      <Toast msg={toast} />
    </div>
  );
}
