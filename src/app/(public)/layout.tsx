import Link from 'next/link';
import { Mail, ArrowRight, Apple, Globe } from 'lucide-react';
import { prisma } from '@/lib/db';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const socialLinks = await prisma.socialLink.findMany({ where: { enabled: true }, orderBy: { order: 'asc' } });
  const company = await prisma.companyInformation.findFirst();
  
  return (
    <div className="min-h-screen flex flex-col bg-[#050505] text-zinc-100 selection:bg-[#00e599]/30">
      <header className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Elario<span className="text-[#00e599]">Labs</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <Link href="/" className="text-[#00e599]">Home</Link>
            <Link href="/about" className="hover:text-zinc-100 transition-colors">About</Link>
            <Link href="/apps" className="hover:text-zinc-100 transition-colors">Apps</Link>
            <Link href="/#process" className="hover:text-zinc-100 transition-colors">Process</Link>
            <Link href="/#faq" className="hover:text-zinc-100 transition-colors">FAQ</Link>
          </nav>
          <Link href="/apps" className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 text-sm font-medium hover:bg-white/5 transition-colors">
            Our Apps <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>
      
      <main className="flex-1">
        {children}
      </main>
      
      <footer className="border-t border-white/5 bg-[#050505] pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-16">
            <div>
              <Link href="/" className="text-2xl font-bold tracking-tight block mb-1">
                Elario<span className="text-[#00e599]">Labs</span>
              </Link>
              <p className="text-sm text-zinc-500">iOS App Development Studio</p>
            </div>
            
            <nav className="flex items-center gap-6 text-sm font-medium text-zinc-400">
              <Link href="/" className="hover:text-zinc-100 transition-colors">Home</Link>
              <Link href="/about" className="hover:text-zinc-100 transition-colors">About</Link>
              <Link href="/apps" className="hover:text-zinc-100 transition-colors">Apps</Link>
              <Link href="/#process" className="hover:text-zinc-100 transition-colors">Process</Link>
              <Link href="/#faq" className="hover:text-zinc-100 transition-colors">FAQ</Link>
            </nav>
            
            <div className="flex items-center gap-3">
              {socialLinks.map(link => (
                <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
                  {link.platform.toLowerCase().includes('instagram') ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                  ) : link.platform.toLowerCase().includes('twitter') || link.platform.toLowerCase() === 'x' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z" /><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" /></svg>
                  ) : link.platform.toLowerCase().includes('mail') ? (
                    <Mail className="w-4 h-4" />
                  ) : (
                    <Globe className="w-4 h-4" />
                  )}
                </a>
              ))}
              {socialLinks.length === 0 && (
                <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"><Mail className="w-4 h-4" /></a>
              )}
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-600 border-t border-white/5 pt-8">
            <p>{company?.copyrightText || `© ${new Date().getFullYear()} ElarioLabs. All rights reserved.`}</p>
            <p>Building useful apps for a better everyday.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
