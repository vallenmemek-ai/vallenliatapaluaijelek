import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import LoginForm from '@/components/LoginForm';

export default function Home() {
  if (isAdmin()) redirect('/dashboard');
  return <LoginForm />;
}
