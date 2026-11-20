'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import s from './Sidebar.module.css';

const items = [
  { href: '/dashboard', label: 'License Keys', icon: 'M3 11h18v10H3z M12 16h.01 M7 11V7a5 5 0 0110 0v4' },
  { href: '/devices', label: 'Devices', icon: 'M5 2h14v20H5z M12 18h.01' },
  { href: '/activity', label: 'Activity', icon: 'M3 3v18h18 M7 14l4-4 3 3 5-6' },
  { href: '/settings', label: 'Settings', icon: 'M12 15a3 3 0 100-6 3 3 0 000 6z M19 12h2 M3 12h2 M12 3v2 M12 19v2' },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className={s.side}>
      <div className="brand" style={{ marginBottom: 26, padding: '0 6px' }}>
        <div className="mark">V</div>
        <div><div className="name">VALLEN</div><div className="sub">Admin</div></div>
      </div>
      <nav className={s.nav}>
        {items.map(it => (
          <Link key={it.href} href={it.href} className={`${s.link} ${path.startsWith(it.href) ? s.active : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={it.icon} /></svg>
            {it.label}
          </Link>
        ))}
      </nav>
      <div className={s.spacer} />
      <div className={s.foot}>
        <div className={s.avatar}>VG</div>
        <div><div className={s.who}>vallenganteng</div><div className={s.role}>Administrator</div></div>
      </div>
    </aside>
  );
}
