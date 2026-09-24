import { prisma } from '@/lib/db';
import Link from 'next/link';
import { format } from 'date-fns';
export default async function PublicBlogPage() {
  const articles = await prisma.blogArticle.findMany({ where: { status: 'PUBLISHED' }, orderBy: { publishedAt: 'desc' }, include: { coverImage: true } });
  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-semibold tracking-tight mb-4">Blog</h1>
      <p className="text-zinc-500 dark:text-zinc-400 text-lg mb-12">News, updates, and thoughts from ElarioLabs.</p>
      <div className="space-y-12">
        {articles.map((article) => (
          <article key={article.id} className="group relative flex flex-col md:flex-row gap-8 items-start">
            {article.coverImage && (
              <div className="w-full md:w-1/3 aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 shrink-0">
                <img src={article.coverImage.url} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
              </div>
            )}
            <div className="flex-1">
              <time className="text-sm text-zinc-500 mb-2 block">{article.publishedAt ? format(article.publishedAt, 'MMMM d, yyyy') : ''}</time>
              <h2 className="text-2xl font-semibold mb-3">
                <Link href={`/blog/${article.slug}`}>
                  <span className="absolute inset-0" />
                  {article.title}
                </Link>
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-3">{article.excerpt}</p>
              <div className="text-sm font-medium text-blue-600 group-hover:underline">Read article &rarr;</div>
            </div>
          </article>
        ))}
        {articles.length === 0 && <div className="py-12 text-center text-zinc-500">No articles published yet.</div>}
      </div>
    </div>
  );
}
