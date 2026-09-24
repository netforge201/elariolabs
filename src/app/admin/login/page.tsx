import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import LoginForm from './LoginForm';
export default async function LoginPage() {
  const adminCount = await prisma.adminUser.count();
  if (adminCount === 0) { redirect('/admin/setup'); }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
      <div className="max-w-md w-full p-8 bg-white dark:bg-zinc-800 shadow-sm border border-zinc-200 dark:border-zinc-700 rounded-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold mb-2">ElarioLabs Admin</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Sign in to manage your content.</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
