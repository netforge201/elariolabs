cat << 'INNER_EOF' > "src/app/admin/(dashboard)/pages/actions.ts"
'use server';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
export async function savePage(formData: FormData, id?: string) {
  const title = formData.get('title') as string;
  const slug = formData.get('slug') as string;
  const content = formData.get('content') as string;
  const status = formData.get('status') as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  if (!title || !slug || !content) return { error: 'Title, slug, and content are required' };
  const data = { title, slug, content, status };
  if (id) { await prisma.staticPage.update({ where: { id }, data }); } else { await prisma.staticPage.create({ data }); }
  revalidatePath('/admin/pages'); revalidatePath(`/${slug}`);
  redirect('/admin/pages');
}
export async function deletePage(id: string) {
  await prisma.staticPage.delete({ where: { id } });
  revalidatePath('/admin/pages');
  redirect('/admin/pages');
}
INNER_EOF

cat << 'INNER_EOF' > "src/app/admin/(dashboard)/pages/PageForm.tsx"
'use client';
import { useActionState, useState } from 'react';
import { savePage } from './actions';
import Link from 'next/link';
import RichTextEditor from '@/components/admin/RichTextEditor';
export default function PageForm({ initialData }: { initialData?: any }) {
  const [content, setContent] = useState(initialData?.content || '');
  const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => { formData.set('content', content); return await savePage(formData, initialData?.id); }, null);
  return (
    <form action={formAction} className="max-w-4xl space-y-6">
      {state?.error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">{state.error}</div>}
      <div className="grid grid-cols-2 gap-6">
        <div><label className="block text-sm font-medium mb-1">Title</label><input type="text" name="title" required defaultValue={initialData?.title} className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" /></div>
        <div><label className="block text-sm font-medium mb-1">Slug</label><input type="text" name="slug" required defaultValue={initialData?.slug} className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" /></div>
      </div>
      <div><label className="block text-sm font-medium mb-1">Content</label><RichTextEditor content={content} onChange={setContent} /></div>
      <div>
        <label className="block text-sm font-medium mb-1">Status</label>
        <select name="status" defaultValue={initialData?.status || 'DRAFT'} className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700"><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></select>
      </div>
      <div className="flex gap-4 pt-4 border-t dark:border-zinc-800">
        <button type="submit" disabled={isPending} className="bg-black text-white dark:bg-white dark:text-black px-6 py-2 rounded-md font-medium disabled:opacity-50">{isPending ? 'Saving...' : 'Save Page'}</button>
        <Link href="/admin/pages" className="px-6 py-2 border rounded-md font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900">Cancel</Link>
      </div>
    </form>
  );
}
INNER_EOF

cat << 'INNER_EOF' > "src/app/admin/(dashboard)/pages/page.tsx"
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';
export default async function PagesIndex() {
  const pages = await prisma.staticPage.findMany({ orderBy: { createdAt: 'desc' } });
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Static Pages</h1>
        <Link href="/admin/pages/new" className="bg-black text-white dark:bg-white dark:text-black px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> Create Page</Link>
      </div>
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
            <tr><th className="px-6 py-3 font-medium text-zinc-500">Title</th><th className="px-6 py-3 font-medium text-zinc-500">Slug</th><th className="px-6 py-3 font-medium text-zinc-500">Status</th><th className="px-6 py-3 font-medium text-zinc-500 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {pages.map((p) => (
              <tr key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                <td className="px-6 py-4 font-medium">{p.title}</td>
                <td className="px-6 py-4">/{p.slug}</td>
                <td className="px-6 py-4">{p.status}</td>
                <td className="px-6 py-4 text-right"><Link href={`/admin/pages/${p.id}`} className="text-blue-600 hover:underline">Edit</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
INNER_EOF

cat << 'INNER_EOF' > "src/app/admin/(dashboard)/pages/new/page.tsx"
import PageForm from '../PageForm';
export default function NewPage() { return <div><h1 className="text-2xl font-semibold tracking-tight mb-6">Create Page</h1><PageForm /></div>; }
INNER_EOF

cat << 'INNER_EOF' > "src/app/admin/(dashboard)/pages/[id]/page.tsx"
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import PageForm from '../PageForm';
import { deletePage } from '../actions';
export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const page = await prisma.staticPage.findUnique({ where: { id: resolvedParams.id } });
  if (!page) notFound();
  return (
    <div>
      <div className="flex justify-between items-center mb-6 max-w-4xl">
        <h1 className="text-2xl font-semibold tracking-tight">Edit Page</h1>
        <form action={async () => { 'use server'; await deletePage(page.id); }}><button type="submit" className="text-red-600 hover:underline text-sm font-medium">Delete</button></form>
      </div>
      <PageForm initialData={page} />
    </div>
  );
}
INNER_EOF

cat << 'INNER_EOF' > "src/app/admin/(dashboard)/company/actions.ts"
'use server';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
export async function saveCompanyInfo(formData: FormData) {
  const name = formData.get('name') as string;
  const about = formData.get('about') as string;
  const email = formData.get('email') as string;
  const data = { name, about, email };
  const existing = await prisma.companyInformation.findFirst();
  if (existing) { await prisma.companyInformation.update({ where: { id: existing.id }, data }); }
  else { await prisma.companyInformation.create({ data }); }
  revalidatePath('/'); revalidatePath('/admin/company');
}
INNER_EOF

cat << 'INNER_EOF' > "src/app/admin/(dashboard)/company/page.tsx"
import { prisma } from '@/lib/db';
import { saveCompanyInfo } from './actions';
export default async function CompanyPage() {
  const info = await prisma.companyInformation.findFirst();
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Company Information</h1>
      <form action={async (formData) => { 'use server'; await saveCompanyInfo(formData); }} className="space-y-6">
        <div><label className="block text-sm font-medium mb-1">Company Name</label><input type="text" name="name" defaultValue={info?.name} className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" /></div>
        <div><label className="block text-sm font-medium mb-1">About Text</label><textarea name="about" rows={4} defaultValue={info?.about || ''} className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" /></div>
        <div><label className="block text-sm font-medium mb-1">Public Email</label><input type="email" name="email" defaultValue={info?.email || ''} className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" /></div>
        <button type="submit" className="bg-black text-white dark:bg-white dark:text-black px-6 py-2 rounded-md font-medium">Save Information</button>
      </form>
    </div>
  );
}
INNER_EOF

cat << 'INNER_EOF' > "src/app/admin/(dashboard)/social/page.tsx"
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
export default async function SocialPage() {
  const links = await prisma.socialLink.findMany();
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Social Links</h1>
      <form action={async (formData) => {
        'use server';
        const platform = formData.get('platform') as string;
        const url = formData.get('url') as string;
        if(platform && url) await prisma.socialLink.create({ data: { platform, url, isVisible: true } });
        revalidatePath('/admin/social');
      }} className="flex gap-4 items-end mb-8">
        <div className="flex-1"><label className="block text-sm font-medium mb-1">Platform (e.g. Twitter)</label><input type="text" name="platform" required className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" /></div>
        <div className="flex-1"><label className="block text-sm font-medium mb-1">URL</label><input type="url" name="url" required className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" /></div>
        <button type="submit" className="bg-black text-white dark:bg-white dark:text-black px-6 py-2 rounded-md font-medium">Add</button>
      </form>
      <div className="space-y-4">
        {links.map(link => (
          <div key={link.id} className="flex justify-between items-center p-4 border rounded-md bg-white dark:bg-zinc-950 dark:border-zinc-800">
            <div><p className="font-medium">{link.platform}</p><p className="text-sm text-zinc-500">{link.url}</p></div>
            <form action={async () => { 'use server'; await prisma.socialLink.delete({ where: { id: link.id } }); revalidatePath('/admin/social'); }}>
              <button type="submit" className="text-red-600 text-sm">Remove</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
INNER_EOF

cat << 'INNER_EOF' > "src/app/admin/(dashboard)/settings/page.tsx"
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
export default async function SettingsPage() {
  const settings = await prisma.siteSettings.findFirst();
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Site Settings</h1>
      <form action={async (formData) => {
        'use server';
        const siteName = formData.get('siteName') as string;
        const defaultSeoDescription = formData.get('defaultSeoDescription') as string;
        const data = { siteName, defaultSeoDescription };
        const existing = await prisma.siteSettings.findFirst();
        if (existing) { await prisma.siteSettings.update({ where: { id: existing.id }, data }); }
        else { await prisma.siteSettings.create({ data }); }
        revalidatePath('/', 'layout'); revalidatePath('/admin/settings');
      }} className="space-y-6">
        <div><label className="block text-sm font-medium mb-1">Site Name</label><input type="text" name="siteName" defaultValue={settings?.siteName || ''} className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" /></div>
        <div><label className="block text-sm font-medium mb-1">Default SEO Description</label><textarea name="defaultSeoDescription" rows={3} defaultValue={settings?.defaultSeoDescription || ''} className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" /></div>
        <button type="submit" className="bg-black text-white dark:bg-white dark:text-black px-6 py-2 rounded-md font-medium">Save Settings</button>
      </form>
    </div>
  );
}
INNER_EOF

