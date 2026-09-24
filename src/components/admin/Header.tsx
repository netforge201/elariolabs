'use client';
import { LogOut } from 'lucide-react';
import { useTransition } from 'react';
import { logoutAdmin } from '@/app/admin/actions';
export default function Header({ userEmail }: { userEmail: string }) {
  const [isPending, startTransition] = useTransition();
  const handleLogout = () => { startTransition(() => { logoutAdmin(); }); };
  return (
    <header className="h-16 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6 shrink-0">
      <div className="md:hidden font-semibold">ElarioLabs</div>
      <div className="hidden md:block" />
      <div className="flex items-center gap-4 text-sm">
        <span className="text-zinc-500 dark:text-zinc-400">{userEmail}</span>
        <button onClick={handleLogout} disabled={isPending} className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors">
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
