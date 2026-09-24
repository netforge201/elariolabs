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
