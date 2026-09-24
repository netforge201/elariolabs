import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import type { Metadata } from 'next';
import DOMPurify from 'isomorphic-dompurify';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const article = await prisma.blogArticle.findUnique({ where: { slug: resolvedParams.slug, status: 'PUBLISHED' }, include: { ogImage: true } });
  if (!article) return {};
  return { title: article.seoTitle || `${article.title} | ElarioLabs Blog`, description: article.seoDescription || article.excerpt, openGraph: { title: article.ogTitle || article.seoTitle || article.title, description: article.ogDescription || article.seoDescription || article.excerpt || undefined, images: article.ogImage ? [article.ogImage.url] : [], } };
}
export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const article = await prisma.blogArticle.findUnique({ where: { slug: resolvedParams.slug, status: 'PUBLISHED' }, include: { coverImage: true } });
  if (!article) notFound();
  const cleanContent = DOMPurify.sanitize(article.content);
  return (
    <article className="max-w-3xl mx-auto px-6 py-20">
      <header className="mb-12">
        <div className="text-sm text-zinc-500 mb-4 space-x-2">
          {article.publishedAt && <time dateTime={article.publishedAt.toISOString()}>{format(article.publishedAt, 'MMMM d, yyyy')}</time>}
          <span>&middot;</span><span>{article.author || 'ElarioLabs Studio'}</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">{article.title}</h1>
        {article.excerpt && <p className="text-xl text-zinc-500 dark:text-zinc-400">{article.excerpt}</p>}
      </header>
      {article.coverImage && (
        <div className="w-full aspect-[16/9] md:aspect-[2/1] rounded-3xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 mb-12">
          <img src={article.coverImage.url} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="prose prose-zinc dark:prose-invert prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: cleanContent }} />
    </article>
  );
}
