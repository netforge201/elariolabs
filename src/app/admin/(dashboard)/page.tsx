import { prisma } from '@/lib/db';
import Link from 'next/link';
import { Smartphone, FileText, ImageIcon } from 'lucide-react';
export default async function DashboardPage() {
  const [totalApps, publishedApps, totalArticles, publishedArticles, totalMedia] = await Promise.all([ prisma.application.count(), prisma.application.count({ where: { status: 'PUBLISHED' } }), prisma.blogArticle.count(), prisma.blogArticle.count({ where: { status: 'PUBLISHED' } }), prisma.mediaAsset.count(), ]);
  const stats = [ { label: 'Total Applications', value: totalApps, subValue: `${publishedApps} published`, icon: Smartphone, href: '/admin/apps' }, { label: 'Blog Articles', value: totalArticles, subValue: `${publishedArticles} published`, icon: FileText, href: '/admin/blog' }, { label: 'Media Assets', value: totalMedia, subValue: 'Images & files', icon: ImageIcon, href: '/admin/media' }, ];
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors flex items-start justify-between">
            <div><p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">{stat.label}</p><p className="text-3xl font-semibold mb-1">{stat.value}</p><p className="text-sm text-zinc-500 dark:text-zinc-500">{stat.subValue}</p></div>
            <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg"><stat.icon className="w-5 h-5 text-zinc-700 dark:text-zinc-300" /></div>
          </Link>
        ))}
      </div>
    </div>
  );
}
