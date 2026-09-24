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
  const coverImageId = formData.get('coverImageId') as string || null;
  const isFeatured = formData.get('isFeatured') === 'true';
  const seoTitle = formData.get('seoTitle') as string || null;
  const seoDescription = formData.get('seoDescription') as string || null;
  
  if (!title || !slug || !content) return { error: 'Title, slug, and content are required' };
  
  const data = { title, slug, excerpt, content, author, status, coverImageId, isFeatured, seoTitle, seoDescription, publishedAt: status === 'PUBLISHED' ? new Date() : null };
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
import MediaSelector from '@/components/admin/MediaSelector';

export default function BlogForm({ initialData }: { initialData?: any }) {
  const [content, setContent] = useState(initialData?.content || '');
  const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => { formData.set('content', content); return await saveArticle(formData, initialData?.id); }, null);
  return (
    <form action={formAction} className="max-w-4xl space-y-6 pb-20">
      {state?.error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">{state.error}</div>}
      
      <div className="grid grid-cols-2 gap-6">
        <div><label className="block text-sm font-medium mb-1">Title</label><input type="text" name="title" required defaultValue={initialData?.title} className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" /></div>
        <div><label className="block text-sm font-medium mb-1">Slug</label><input type="text" name="slug" required defaultValue={initialData?.slug} className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" /></div>
      </div>
      <div><label className="block text-sm font-medium mb-1">Excerpt</label><textarea name="excerpt" rows={3} defaultValue={initialData?.excerpt} className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" /></div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Cover Image</label>
        <MediaSelector name="coverImageId" defaultValue={initialData?.coverImageId} defaultUrl={initialData?.coverImage?.url} />
      </div>

      <div><label className="block text-sm font-medium mb-1">Content</label><RichTextEditor content={content} onChange={setContent} /></div>
      
      <div className="grid grid-cols-2 gap-6">
        <div><label className="block text-sm font-medium mb-1">SEO Title</label><input type="text" name="seoTitle" defaultValue={initialData?.seoTitle} className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" /></div>
        <div><label className="block text-sm font-medium mb-1">SEO Description</label><input type="text" name="seoDescription" defaultValue={initialData?.seoDescription} className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" /></div>
      </div>

      <div className="grid grid-cols-3 gap-6 items-center">
        <div><label className="block text-sm font-medium mb-1">Author</label><input type="text" name="author" defaultValue={initialData?.author || 'ElarioLabs Studio'} className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" /></div>
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select name="status" defaultValue={initialData?.status || 'DRAFT'} className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700">
            <option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option>
          </select>
        </div>
        <div className="pt-6">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" name="isFeatured" value="true" defaultChecked={initialData?.isFeatured} className="rounded" />
            Featured Article
          </label>
        </div>
      </div>

      <div className="flex gap-4 pt-4 border-t dark:border-zinc-800">
        <button type="submit" disabled={isPending} className="bg-black text-white dark:bg-white dark:text-black px-6 py-2 rounded-md font-medium disabled:opacity-50">{isPending ? 'Saving...' : 'Save Article'}</button>
        <Link href="/admin/blog" className="px-6 py-2 border rounded-md font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900">Cancel</Link>
      </div>
    </form>
  );
}
INNER_EOF

