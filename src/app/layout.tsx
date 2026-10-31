import './globals.css';
import AnalyticsTracker from './AnalyticsTracker';
import { db } from '@/lib/db';
import type {Metadata} from 'next';

const siteUrl = 'https://elariolabs.com';

export async function generateMetadata(): Promise<Metadata> {
  let title = 'ElarioLabs — Independent Software Studio';
  let description =
    'Discover thoughtfully designed software and mobile applications by ElarioLabs, an independent software studio focused on practical digital products.';

  try {
    const settings = await db.siteSetting.findMany({
      where: { key: { in: ['seo.title', 'seo.description'] } },
    });

    for (const setting of settings) {
      if (setting.key === 'seo.title' && typeof setting.value === 'string' && setting.value.trim()) {
        title = setting.value.trim();
      }
      if (setting.key === 'seo.description' && typeof setting.value === 'string' && setting.value.trim()) {
        description = setting.value.trim();
      }
    }
  } catch {
    // Keep safe defaults if settings are temporarily unavailable.
  }

  return {
    metadataBase: new URL('https://elariolabs.com'),
    title: { default: title, template: '%s | ElarioLabs' },
    description,
    applicationName: 'ElarioLabs',
    openGraph: {
      type: 'website',
      siteName: 'ElarioLabs',
      title,
      description,
      url: '/',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body><AnalyticsTracker />{children}</body></html>;
}
