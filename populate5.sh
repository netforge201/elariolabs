cat << 'INNER_EOF' > "src/app/admin/(dashboard)/apps/actions.ts"
'use server';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
export async function saveApplication(formData: FormData, id?: string) {
  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  const shortDescription = formData.get('shortDescription') as string;
  const fullDescription = formData.get('fullDescription') as string;
  const appStoreStatus = formData.get('appStoreStatus') as 'COMING_SOON' | 'AVAILABLE';
  const appStoreUrl = formData.get('appStoreUrl') as string || null;
  const status = formData.get('status') as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  if (!name || !slug) return { error: 'Name and slug are required' };
  const data = { name, slug, shortDescription, fullDescription, appStoreStatus, appStoreUrl, status };
  if (id) { await prisma.application.update({ where: { id }, data }); } else { await prisma.application.create({ data }); }
  revalidatePath('/admin/apps'); revalidatePath('/apps'); revalidatePath('/');
  redirect('/admin/apps');
}
export async function deleteApplication(id: string) {
  await prisma.application.delete({ where: { id } });
  revalidatePath('/admin/apps'); revalidatePath('/apps'); revalidatePath('/');
  redirect('/admin/apps');
}
INNER_EOF

cat << 'INNER_EOF' > "src/app/admin/(dashboard)/apps/AppForm.tsx"
'use client';
import { useActionState } from 'react';
import { saveApplication } from './actions';
import Link from 'next/link';
export default function AppForm({ initialData }: { initialData?: any }) {
  const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => { return await saveApplication(formData, initialData?.id); }, null);
  return (
    <form action={formAction} className="max-w-3xl space-y-6">
      {state?.error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">{state.error}</div>}
      <div className="grid grid-cols-2 gap-6">
        <div><label className="block text-sm font-medium mb-1">Name</label><input type="text" name="name" required defaultValue={initialData?.name} className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" /></div>
        <div><label className="block text-sm font-medium mb-1">Slug</label><input type="text" name="slug" required defaultValue={initialData?.slug} className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" /></div>
      </div>
      <div><label className="block text-sm font-medium mb-1">Short Description</label><input type="text" name="shortDescription" defaultValue={initialData?.shortDescription} className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" /></div>
      <div><label className="block text-sm font-medium mb-1">Full Description</label><textarea name="fullDescription" rows={5} defaultValue={initialData?.fullDescription} className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" /></div>
      <div className="grid grid-cols-2 gap-6">
        <div><label className="block text-sm font-medium mb-1">App Store Status</label><select name="appStoreStatus" defaultValue={initialData?.appStoreStatus || 'COMING_SOON'} className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700"><option value="COMING_SOON">Coming Soon</option><option value="AVAILABLE">Available</option></select></div>
        <div><label className="block text-sm font-medium mb-1">Publication Status</label><select name="status" defaultValue={initialData?.status || 'DRAFT'} className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700"><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></select></div>
      </div>
      <div className="flex gap-4 pt-4 border-t dark:border-zinc-800">
        <button type="submit" disabled={isPending} className="bg-black text-white dark:bg-white dark:text-black px-6 py-2 rounded-md font-medium disabled:opacity-50">{isPending ? 'Saving...' : 'Save Application'}</button>
        <Link href="/admin/apps" className="px-6 py-2 border rounded-md font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900">Cancel</Link>
      </div>
    </form>
  );
}
INNER_EOF

cat << 'INNER_EOF' > "src/app/admin/(dashboard)/apps/new/page.tsx"
import AppForm from '../AppForm';
export default function NewAppPage() { return <div><h1 className="text-2xl font-semibold tracking-tight mb-6">Add Application</h1><AppForm /></div>; }
INNER_EOF

cat << 'INNER_EOF' > "src/app/admin/(dashboard)/apps/[id]/page.tsx"
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import AppForm from '../AppForm';
import { deleteApplication } from '../actions';
export default async function EditAppPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const app = await prisma.application.findUnique({ where: { id: resolvedParams.id } });
  if (!app) notFound();
  return (
    <div>
      <div className="flex justify-between items-center mb-6 max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight">Edit Application</h1>
        <form action={async () => { 'use server'; await deleteApplication(app.id); }}><button type="submit" className="text-red-600 hover:underline text-sm font-medium">Delete</button></form>
      </div>
      <AppForm initialData={app} />
    </div>
  );
}
INNER_EOF

cat << 'INNER_EOF' > "src/app/admin/(dashboard)/apps/page.tsx"
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';
export default async function AppsPage() {
  const apps = await prisma.application.findMany({ orderBy: { createdAt: 'desc' } });
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Applications</h1>
        <Link href="/admin/apps/new" className="bg-black text-white dark:bg-white dark:text-black px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> Add Application</Link>
      </div>
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
            <tr><th className="px-6 py-3 font-medium text-zinc-500">Name</th><th className="px-6 py-3 font-medium text-zinc-500">Status</th><th className="px-6 py-3 font-medium text-zinc-500">Updated</th><th className="px-6 py-3 font-medium text-zinc-500 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {apps.map((app) => (
              <tr key={app.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                <td className="px-6 py-4 font-medium">{app.name}</td>
                <td className="px-6 py-4">{app.status}</td>
                <td className="px-6 py-4 text-zinc-500">{format(app.updatedAt, 'MMM d, yyyy')}</td>
                <td className="px-6 py-4 text-right"><Link href={`/admin/apps/${app.id}`} className="text-blue-600 hover:underline">Edit</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
INNER_EOF

cat << 'INNER_EOF' > "src/app/admin/(dashboard)/blog/actions.ts"
'use server';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
export async function saveArticle(formData: FormData, id?: string) {
  const title = formData.get('title') as string;
  const slug = formData.get('slug') as string;
  const excerpt = formData.get('excerpt') as string;
  const content = formData.get('content') as string;
  const author = formData.get('author') as string;
  const status = formData.get('status') as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  if (!title || !slug || !content) return { error: 'Title, slug, and content are required' };
  const data = { title, slug, excerpt, content, author, status, publishedAt: status === 'PUBLISHED' ? new Date() : null };
  if (id) {
    const existing = await prisma.blogArticle.findUnique({ where: { id } });
    if (existing?.publishedAt && status === 'PUBLISHED') { data.publishedAt = existing.publishedAt; }
    await prisma.blogArticle.update({ where: { id }, data });
  } else {
    await prisma.blogArticle.create({ data });
  }
  revalidatePath('/admin/blog'); revalidatePath('/blog'); revalidatePath('/');
  redirect('/admin/blog');
}
export async function deleteArticle(id: string) {
  await prisma.blogArticle.delete({ where: { id } });
  revalidatePath('/admin/blog'); revalidatePath('/blog'); revalidatePath('/');
  redirect('/admin/blog');
}
INNER_EOF

cat << 'INNER_EOF' > "src/app/admin/(dashboard)/blog/BlogForm.tsx"
'use client';
import { useActionState, useState } from 'react';
import { saveArticle } from './actions';
import Link from 'next/link';
import RichTextEditor from '@/components/admin/RichTextEditor';
export default function BlogForm({ initialData }: { initialData?: any }) {
  const [content, setContent] = useState(initialData?.content || '');
  const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => { formData.set('content', content); return await saveArticle(formData, initialData?.id); }, null);
  return (
    <form action={formAction} className="max-w-4xl space-y-6">
      {state?.error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">{state.error}</div>}
      <div className="grid grid-cols-2 gap-6">
        <div><label className="block text-sm font-medium mb-1">Title</label><input type="text" name="title" required defaultValue={initialData?.title} className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" /></div>
        <div><label className="block text-sm font-medium mb-1">Slug</label><input type="text" name="slug" required defaultValue={initialData?.slug} className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" /></div>
      </div>
      <div><label className="block text-sm font-medium mb-1">Excerpt</label><textarea name="excerpt" rows={3} defaultValue={initialData?.excerpt} className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" /></div>
      <div><label className="block text-sm font-medium mb-1">Content</label><RichTextEditor content={content} onChange={setContent} /></div>
      <div className="grid grid-cols-2 gap-6">
        <div><label className="block text-sm font-medium mb-1">Author</label><input type="text" name="author" defaultValue={initialData?.author || 'ElarioLabs Studio'} className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" /></div>
        <div><label className="block text-sm font-medium mb-1">Status</label><select name="status" defaultValue={initialData?.status || 'DRAFT'} className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700"><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></select></div>
      </div>
      <div className="flex gap-4 pt-4 border-t dark:border-zinc-800">
        <button type="submit" disabled={isPending} className="bg-black text-white dark:bg-white dark:text-black px-6 py-2 rounded-md font-medium disabled:opacity-50">{isPending ? 'Saving...' : 'Save Article'}</button>
        <Link href="/admin/blog" className="px-6 py-2 border rounded-md font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900">Cancel</Link>
      </div>
    </form>
  );
}
INNER_EOF

cat << 'INNER_EOF' > "src/app/admin/(dashboard)/blog/new/page.tsx"
import BlogForm from '../BlogForm';
export default function NewArticlePage() { return <div><h1 className="text-2xl font-semibold tracking-tight mb-6">Write Article</h1><BlogForm /></div>; }
INNER_EOF

cat << 'INNER_EOF' > "src/app/admin/(dashboard)/blog/[id]/page.tsx"
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import BlogForm from '../BlogForm';
import { deleteArticle } from '../actions';
export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const article = await prisma.blogArticle.findUnique({ where: { id: resolvedParams.id } });
  if (!article) notFound();
  return (
    <div>
      <div className="flex justify-between items-center mb-6 max-w-4xl">
        <h1 className="text-2xl font-semibold tracking-tight">Edit Article</h1>
        <form action={async () => { 'use server'; await deleteArticle(article.id); }}><button type="submit" className="text-red-600 hover:underline text-sm font-medium">Delete</button></form>
      </div>
      <BlogForm initialData={article} />
    </div>
  );
}
INNER_EOF

cat << 'INNER_EOF' > "src/app/admin/(dashboard)/blog/page.tsx"
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';
export default async function BlogPage() {
  const articles = await prisma.blogArticle.findMany({ orderBy: { createdAt: 'desc' } });
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Blog Articles</h1>
        <Link href="/admin/blog/new" className="bg-black text-white dark:bg-white dark:text-black px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> Write Article</Link>
      </div>
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
            <tr><th className="px-6 py-3 font-medium text-zinc-500">Title</th><th className="px-6 py-3 font-medium text-zinc-500">Status</th><th className="px-6 py-3 font-medium text-zinc-500 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {articles.map((article) => (
              <tr key={article.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                <td className="px-6 py-4 font-medium">{article.title}</td>
                <td className="px-6 py-4">{article.status}</td>
                <td className="px-6 py-4 text-right"><Link href={`/admin/blog/${article.id}`} className="text-blue-600 hover:underline">Edit</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
INNER_EOF

cat << 'INNER_EOF' > "src/app/admin/(dashboard)/media/MediaUpload.tsx"
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';
export default function MediaUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData, });
      if (res.ok) { router.refresh(); } else { const data = await res.json(); alert(data.error || 'Upload failed'); }
    } catch (err) { alert('Upload failed'); } finally { setIsUploading(false); e.target.value = ''; }
  };
  return (
    <div className="relative">
      <input type="file" accept="image/*" onChange={handleFileChange} disabled={isUploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" />
      <div className="bg-black text-white dark:bg-white dark:text-black px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 pointer-events-none">
        <Upload className="w-4 h-4" /> {isUploading ? 'Uploading...' : 'Upload Media'}
      </div>
    </div>
  );
}
INNER_EOF

cat << 'INNER_EOF' > "src/app/admin/(dashboard)/media/page.tsx"
import { prisma } from '@/lib/db';
import { format } from 'date-fns';
import MediaUpload from './MediaUpload';
export default async function MediaPage() {
  const assets = await prisma.mediaAsset.findMany({ orderBy: { createdAt: 'desc' } });
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Media Library</h1>
        <MediaUpload />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {assets.map((asset) => (
          <div key={asset.id} className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950 group relative">
            <div className="aspect-square bg-zinc-100 dark:bg-zinc-900 relative"><img src={asset.url} alt={asset.altText || ''} className="w-full h-full object-cover" /></div>
            <div className="p-3">
              <p className="text-xs font-medium truncate mb-1" title={asset.originalName}>{asset.originalName}</p>
              <p className="text-[10px] text-zinc-500">{(asset.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
INNER_EOF

