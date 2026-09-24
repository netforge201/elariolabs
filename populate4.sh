cat << 'INNER_EOF' > "src/app/admin/setup/actions.ts"
'use server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { createSession } from '@/lib/session';
import { redirect } from 'next/navigation';
export async function initializeAdmin(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  if (!email || !password || password.length < 8) { return { error: 'Invalid email or password (min 8 characters).' }; }
  const count = await prisma.adminUser.count();
  if (count > 0) { return { error: 'Administrator already exists.' }; }
  const passwordHash = await hashPassword(password);
  const user = await prisma.adminUser.create({ data: { email, passwordHash, }, });
  await createSession(user.id);
  redirect('/admin');
}
INNER_EOF

cat << 'INNER_EOF' > "src/app/admin/setup/SetupForm.tsx"
'use client';
import { useActionState } from 'react';
import { initializeAdmin } from './actions';
export default function SetupForm() {
  const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => { return await initializeAdmin(formData); }, null);
  return (
    <form action={formAction} className="space-y-4">
      {state?.error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">{state.error}</div>}
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input type="email" name="email" required className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Password</label>
        <input type="password" name="password" required minLength={8} className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" />
      </div>
      <button type="submit" disabled={isPending} className="w-full bg-black text-white dark:bg-white dark:text-black py-2 rounded-md font-medium disabled:opacity-50">
        {isPending ? 'Setting up...' : 'Complete Setup'}
      </button>
    </form>
  );
}
INNER_EOF

cat << 'INNER_EOF' > "src/app/admin/setup/page.tsx"
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import SetupForm from './SetupForm';
export default async function SetupPage() {
  const adminCount = await prisma.adminUser.count();
  if (adminCount > 0) { redirect('/admin/login'); }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
      <div className="max-w-md w-full p-8 bg-white dark:bg-zinc-800 shadow-sm border border-zinc-200 dark:border-zinc-700 rounded-lg">
        <h1 className="text-2xl font-semibold mb-2 text-center">ElarioLabs Setup</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 text-center">Create the first administrator account. This can only be done once.</p>
        <SetupForm />
      </div>
    </div>
  );
}
INNER_EOF

cat << 'INNER_EOF' > "src/app/admin/login/actions.ts"
'use server';
import { prisma } from '@/lib/db';
import { verifyPassword } from '@/lib/auth';
import { createSession } from '@/lib/session';
import { redirect } from 'next/navigation';
export async function loginAdmin(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  if (!email || !password) { return { error: 'Invalid email or password.' }; }
  await new Promise(r => setTimeout(r, 500));
  const user = await prisma.adminUser.findUnique({ where: { email }, });
  if (!user) { return { error: 'Invalid email or password.' }; }
  const isValid = await verifyPassword(user.passwordHash, password);
  if (!isValid) { return { error: 'Invalid email or password.' }; }
  await createSession(user.id);
  redirect('/admin');
}
INNER_EOF

cat << 'INNER_EOF' > "src/app/admin/login/LoginForm.tsx"
'use client';
import { useActionState } from 'react';
import { loginAdmin } from './actions';
export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => { return await loginAdmin(formData); }, null);
  return (
    <form action={formAction} className="space-y-4">
      {state?.error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">{state.error}</div>}
      <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" name="email" required className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" /></div>
      <div><label className="block text-sm font-medium mb-1">Password</label><input type="password" name="password" required className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" /></div>
      <button type="submit" disabled={isPending} className="w-full bg-black text-white dark:bg-white dark:text-black py-2 rounded-md font-medium disabled:opacity-50">{isPending ? 'Signing in...' : 'Sign In'}</button>
    </form>
  );
}
INNER_EOF

cat << 'INNER_EOF' > "src/app/admin/login/page.tsx"
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
INNER_EOF

cat << 'INNER_EOF' > "src/app/admin/(dashboard)/layout.tsx"
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
INNER_EOF

cat << 'INNER_EOF' > "src/app/admin/(dashboard)/page.tsx"
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
INNER_EOF

