import Link from 'next/link';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';

export default async function Footer() {
  await headers(); // Принудительно отключаем статическую генерацию при сборке

  const companyInfo = await prisma.companyInformation.findFirst();
  const year = new Date().getFullYear();
  
  return (
    <footer className="bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 py-12 mt-20">
      <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 md:col-span-2">
          <Link href="/" className="font-semibold text-lg tracking-tight mb-4 inline-block">{companyInfo?.name || 'ElarioLabs'}</Link>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-sm">An independent software studio primarily focused on creating useful, polished, high-quality native applications.</p>
        </div>
        <div>
          <h3 className="font-medium mb-4">Products</h3>
          <ul className="space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
            <li><Link href="/apps" className="hover:text-black dark:hover:text-white transition-colors">All Apps</Link></li>
            <li><Link href="/blog" className="hover:text-black dark:hover:text-white transition-colors">Blog</Link></li>
            <li><Link href="/about" className="hover:text-black dark:hover:text-white transition-colors">About Us</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-medium mb-4">Legal</h3>
          <ul className="space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
            <li><Link href="/privacy" className="hover:text-black dark:hover:text-white transition-colors">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-black dark:hover:text-white transition-colors">Terms of Use</Link></li>
            {companyInfo?.email && <li><a href={`mailto:${companyInfo.email}`} className="hover:text-black dark:hover:text-white transition-colors">Contact</a></li>}
          </ul>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-400 dark:text-zinc-500 flex flex-col md:flex-row justify-between items-center">
        <p>© {year} {companyInfo?.copyrightText || companyInfo?.name || 'ElarioLabs'}. All rights reserved.</p>
      </div>
    </footer>
  );
}