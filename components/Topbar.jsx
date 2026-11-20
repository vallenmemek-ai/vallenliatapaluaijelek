'use client';
import { usePathname, useRouter } from 'next/navigation';
import s from './Topbar.module.css';

const titles = { '/dashboard': 'License Keys', '/devices': 'Devices', '/activity': 'Activity', '/settings': 'Settings' };

export default function Topbar() {
  const path = usePathname();
  const router = useRouter();
  const title = Object.keys(titles).find(k => path.startsWith(k));
  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/'); router.refresh();
  }
  return (
    <div className={s.topbar}>
      <div className={s.crumb}>Console / <b>{titles[title] || 'Console'}</b></div>
      <div className={s.right}>
        <button className="btn btn-ghost" onClick={logout}>Logout</button>
      </div>
    </div>
  );
}
