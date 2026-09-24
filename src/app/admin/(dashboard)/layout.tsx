import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/admin/Sidebar';
import Header from '@/components/admin/Header';
export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) { redirect('/admin/login'); }
  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header userEmail={session.user.email} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
