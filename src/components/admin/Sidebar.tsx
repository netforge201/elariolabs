'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Smartphone, FileText, File, Image as ImageIcon, Settings, Building2, Share2 } from 'lucide-react';
import clsx from 'clsx';
const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Applications', href: '/admin/apps', icon: Smartphone },
  { name: 'Blog', href: '/admin/blog', icon: FileText },
  { name: 'Pages', href: '/admin/pages', icon: File },
  { name: 'Media Library', href: '/admin/media', icon: ImageIcon },
  { name: 'Company Info', href: '/admin/company', icon: Building2 },
  { name: 'Social Links', href: '/admin/social', icon: Share2 },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];
export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex flex-col hidden md:flex">
      <div className="h-16 flex items-center px-6 border-b border-zinc-200 dark:border-zinc-800">
        <Link href="/admin" className="font-semibold text-lg tracking-tight">ElarioLabs Studio</Link>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
            return (
              <li key={item.name}>
                <Link href={item.href} className={clsx('flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors', isActive ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-white')}>
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
