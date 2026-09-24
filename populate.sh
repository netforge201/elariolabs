cat << 'INNER_EOF' > src/app/not-found.tsx
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
INNER_EOF

cat << 'INNER_EOF' > src/app/robots.ts
import { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://elariolabs.com';
  return { rules: { userAgent: '*', allow: '/', disallow: ['/admin/', '/api/'] }, sitemap: `${baseUrl}/sitemap.xml` };
}
INNER_EOF

cat << 'INNER_EOF' > src/app/sitemap.ts
import { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://elariolabs.com';
  const publishedApps = await prisma.application.findMany({ where: { status: 'PUBLISHED' }, select: { slug: true, updatedAt: true } });
  const publishedArticles = await prisma.blogArticle.findMany({ where: { status: 'PUBLISHED' }, select: { slug: true, updatedAt: true } });
  const publishedPages = await prisma.staticPage.findMany({ where: { status: 'PUBLISHED' }, select: { slug: true, updatedAt: true } });
  const appUrls = publishedApps.map((app) => ({ url: `${baseUrl}/apps/${app.slug}`, lastModified: app.updatedAt, changeFrequency: 'weekly' as const, priority: 0.8 }));
  const articleUrls = publishedArticles.map((article) => ({ url: `${baseUrl}/blog/${article.slug}`, lastModified: article.updatedAt, changeFrequency: 'weekly' as const, priority: 0.7 }));
  const pageUrls = publishedPages.map((page) => ({ url: `${baseUrl}/${page.slug}`, lastModified: page.updatedAt, changeFrequency: 'monthly' as const, priority: 0.5 }));
  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/apps`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    ...appUrls, ...articleUrls, ...pageUrls,
  ];
}
INNER_EOF

cat << 'INNER_EOF' > src/lib/auth.ts
import * as argon2 from 'argon2';
export async function hashPassword(password: string): Promise<string> { return await argon2.hash(password); }
export async function verifyPassword(hash: string, password: string): Promise<boolean> { return await argon2.verify(hash, password); }
INNER_EOF

cat << 'INNER_EOF' > src/lib/session.ts
import { cookies } from 'next/headers';
import { prisma } from './db';
import { randomBytes } from 'crypto';
export async function createSession(userId: string) {
  const sessionId = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await prisma.session.create({ data: { id: sessionId, userId, expiresAt } });
  const cookieStore = await cookies();
  cookieStore.set('elariolabs_session', session.id, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', expires: expiresAt, path: '/' });
  return session;
}
export async function getSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('elariolabs_session')?.value;
  if (!sessionId) return null;
  const session = await prisma.session.findUnique({ where: { id: sessionId }, include: { user: true } });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) { await prisma.session.delete({ where: { id: session.id } }); return null; }
  return session;
}
export async function deleteSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('elariolabs_session')?.value;
  if (sessionId) { await prisma.session.deleteMany({ where: { id: sessionId } }); }
  cookieStore.delete('elariolabs_session');
}
INNER_EOF

cat << 'INNER_EOF' > src/lib/storage.ts
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs/promises';
export interface UploadResult { url: string; filename: string; size: number; mimeType: string; }
export async function uploadFile(file: File): Promise<UploadResult> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = path.extname(file.name).toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  if (!allowedExts.includes(ext)) { throw new Error('File type not allowed'); }
  const filename = `${randomUUID()}${ext}`;
  const provider = process.env.STORAGE_PROVIDER || 'local';
  if (provider === 'local') {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    const filepath = path.join(uploadDir, filename);
    await fs.writeFile(filepath, buffer);
    return { url: `/uploads/${filename}`, filename, size: file.size, mimeType: file.type };
  } else if (provider === 's3') {
    throw new Error('S3 upload not fully implemented in this iteration.');
  }
  throw new Error('Unknown storage provider');
}
export async function deleteFile(filename: string) {
  const provider = process.env.STORAGE_PROVIDER || 'local';
  if (provider === 'local') {
    try { const filepath = path.join(process.cwd(), 'public', 'uploads', filename); await fs.unlink(filepath); } catch (e) { }
  }
}
INNER_EOF

