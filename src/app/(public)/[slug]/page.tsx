import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import DOMPurify from 'isomorphic-dompurify';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const page = await prisma.staticPage.findUnique({ where: { slug: resolvedParams.slug, status: 'PUBLISHED' }, include: { ogImage: true } });
  if (!page) return {};
  return { title: page.seoTitle || `${page.title} | ElarioLabs`, description: page.seoDescription, openGraph: { images: page.ogImage ? [page.ogImage.url] : [], } };
}
export default async function StaticPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const page = await prisma.staticPage.findUnique({ where: { slug: resolvedParams.slug, status: 'PUBLISHED' } });
  if (!page) notFound();
  const cleanContent = DOMPurify.sanitize(page.content);
  return (
    <article className="max-w-3xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-semibold tracking-tight mb-12">{page.title}</h1>
      <div className="prose prose-zinc dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: cleanContent }} />
    </article>
  );
}
