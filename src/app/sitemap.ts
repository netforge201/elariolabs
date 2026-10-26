import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const base = 'https://elariolabs.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [apps, legal] = await Promise.all([
    db.application.findMany({
      where: { contentState: 'PUBLISHED' },
      select: { slug: true, updatedAt: true },
    }),
    db.legalDocument.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, priority: 1 },
    { url: `${base}/apps`, priority: 0.9 },
    { url: `${base}/about`, priority: 0.7 },
    { url: `${base}/contact`, priority: 0.6 },
  ];

  const applicationPages: MetadataRoute.Sitemap = apps.map((app) => ({
    url: `${base}/apps/${app.slug}`,
    lastModified: app.updatedAt,
    priority: 0.8,
  }));

  const legalPages: MetadataRoute.Sitemap = legal.map((doc) => ({
    url: `${base}/legal/${doc.slug}`,
    lastModified: doc.updatedAt,
    priority: 0.3,
  }));

  return [...staticPages, ...applicationPages, ...legalPages];
}
