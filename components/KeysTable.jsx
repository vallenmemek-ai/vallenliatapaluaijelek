import Badge from './Badge';

function fmtDate(t) {
  if (!t) return '—';
  return new Date(Number(t)).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function KeysTable({ keys, onRevoke, onCopy, onReset }) {
  if (!keys.length) return <div className="table-wrap"><div className="empty">Belum ada key. Klik <b>Generate Key</b> buat bikin.</div></div>;
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>Key</th><th>Label</th><th>Device</th><th>Durasi</th><th>Expired</th><th>Status</th><th style={{ textAlign: 'right' }}>Aksi</th></tr></thead>
        <tbody>
          {keys.map(k => (
            <tr key={k.id}>
              <td><span className="key">{k.key}</span></td>
              <td><span className="lbl">{k.label}</span></td>
              <td><span className="dev">{k.device_id || '—'}</span></td>
              <td className="nowrap">{k.days} hari</td>
              <td className="nowrap">{fmtDate(k.exp)}</td>
              <td><Badge status={k.status} /></td>
              <td>
                <div className="row-act">
                  <button className="icon-btn" title="Copy key" onClick={() => onCopy(k.key)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                  </button>
                  {k.device_id && (
                    <button className="icon-btn" title="Reset device (unbind)" onClick={() => onReset(k.id)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 019-9 9 9 0 016.7 3M21 12a9 9 0 01-9 9 9 9 0 01-6.7-3" /><path d="M21 3v6h-6M3 21v-6h6" /></svg>
                    </button>
                  )}
                  {k.status !== 'revoked' && (
                    <button className="icon-btn danger" title="Revoke" onClick={() => onRevoke(k.id)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M4.9 4.9l14.2 14.2" /></svg>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
