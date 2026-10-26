import './globals.css';
import type {Metadata} from 'next';

const siteUrl = 'https://elariolabs.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'ElarioLabs — Independent Software Studio',
    template: '%s | ElarioLabs',
  },
  description:
    'Discover thoughtfully designed software and mobile applications by ElarioLabs, an independent software studio focused on practical digital products.',
  applicationName: 'ElarioLabs',
  openGraph: {
    type: 'website',
    siteName: 'ElarioLabs',
    title: 'ElarioLabs — Independent Software Studio',
    description:
      'Discover thoughtfully designed software and mobile applications by ElarioLabs.',
    url: '/',
  },
  twitter: {
    card: 'summary',
    title: 'ElarioLabs — Independent Software Studio',
    description:
      'Discover thoughtfully designed software and mobile applications by ElarioLabs.',
  },
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}
