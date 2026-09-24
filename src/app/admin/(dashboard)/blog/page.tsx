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
