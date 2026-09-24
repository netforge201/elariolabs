import Link from 'next/link';
export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg tracking-tight">ElarioLabs</Link>
        <nav className="flex gap-6 text-sm font-medium">
          <Link href="/apps" className="text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white transition-colors">Apps</Link>
          <Link href="/blog" className="text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white transition-colors">Blog</Link>
          <Link href="/about" className="text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white transition-colors">About</Link>
        </nav>
      </div>
    </header>
  );
}
