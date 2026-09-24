'use client';
import { useState } from 'react';
import SubmitButton from '@/components/admin/SubmitButton';
import { savePage } from './actions';
import Link from 'next/link';
import RichTextEditor from '@/components/admin/RichTextEditor';
export default function PageForm({ initialData }: { initialData?: any }) {
  const [content, setContent] = useState(initialData?.content || '');
   
  return (
    <form action={savePage} className="max-w-4xl space-y-6">
      <input type="hidden" name="id" value={initialData?.id || ''} />
      <input type="hidden" name="content" value={content} />
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
        <SubmitButton>Save Page</SubmitButton>
        <Link href="/admin/pages" className="px-6 py-2 border rounded-md font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900">Cancel</Link>
      </div>
    </form>
  );
}
