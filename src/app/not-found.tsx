import Link from 'next/link';
import Header from '@/components/public/Header';
import Footer from '@/components/public/Footer';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 selection:bg-zinc-200 dark:selection:bg-zinc-800">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <h1 className="text-8xl font-semibold tracking-tighter mb-4">404</h1>
        <h2 className="text-2xl font-medium tracking-tight mb-6">Page not found</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-md">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-4">
          <Link href="/" className="bg-black text-white dark:bg-white dark:text-black px-6 py-2 rounded-full font-medium transition-transform hover:scale-105">Return Home</Link>
          <Link href="/apps" className="bg-zinc-100 text-black dark:bg-zinc-800 dark:text-white px-6 py-2 rounded-full font-medium transition-transform hover:scale-105">View Apps</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
