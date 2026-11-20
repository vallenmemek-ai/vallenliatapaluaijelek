import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import s from './panel.module.css';

export default function PanelLayout({ children }) {
  if (!isAdmin()) redirect('/');
  return (
    <div className={s.app}>
      <Sidebar />
      <div className={s.main}>
        <Topbar />
        <div className={s.content}>{children}</div>
      </div>
    </div>
  );
}
