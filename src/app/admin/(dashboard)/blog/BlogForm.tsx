'use client';
import { useState } from 'react';
import SubmitButton from '@/components/admin/SubmitButton';
import { saveArticle } from './actions';
import Link from 'next/link';
import RichTextEditor from '@/components/admin/RichTextEditor';
import MediaSelector from '@/components/admin/MediaSelector';

export default function BlogForm({ initialData }: { initialData?: any }) {
  const [content, setContent] = useState(initialData?.content || '');
   
  return (
    <form action={saveArticle} className="max-w-4xl space-y-6 pb-20">
      <input type="hidden" name="id" value={initialData?.id || ''} />
      <input type="hidden" name="content" value={content} />
      
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
        <SubmitButton>Save Article</SubmitButton>
        <Link href="/admin/blog" className="px-6 py-2 border rounded-md font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900">Cancel</Link>
      </div>
    </form>
  );
}
