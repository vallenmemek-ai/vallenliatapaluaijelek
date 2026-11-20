'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import s from './LoginForm.module.css';

export default function LoginForm() {
  const router = useRouter();
  const [pw, setPw] = useState('');
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr(false);
    const res = await fetch('/api/admin/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    });
    setBusy(false);
    if (res.ok) { router.push('/dashboard'); router.refresh(); }
    else setErr(true);
  }

  return (
    <div className={s.wrap}>
      <form className={s.card} onSubmit={submit}>
        <div className="brand" style={{ marginBottom: 28 }}>
          <div className="mark">V</div>
          <div><div className="name">VALLEN</div><div className="sub">Admin Console</div></div>
        </div>
        <h1 className={s.h1}>Masuk</h1>
        <p className={s.hint}>Kelola license key mod VALLEN.</p>
        <div className="field">
          <label>Password admin</label>
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••" autoFocus autoComplete="off" />
        </div>
        <button className="btn btn-pink btn-block" disabled={busy}>{busy ? 'Memproses…' : 'Masuk'}</button>
        {err && <div className="err">Password salah.</div>}
        <div className={s.foot}>VALLEN GANTENG · v2.0 · by vallenganteng</div>
      </form>
    </div>
  );
}
