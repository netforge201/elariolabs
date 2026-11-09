import type {MetadataRoute} from 'next';

const siteUrl = 'https://elariolabs.com';

export default function robots():MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/', '/login', '/dashboard'],
    },
    sitemap: `${siteUrl.replace(/\/+$/, '')}/sitemap.xml`,
  };
}
