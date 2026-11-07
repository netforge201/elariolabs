import type { Metadata, Viewport } from 'next';
import './globals.css';
import './mobile.css';

export const metadata: Metadata = {
  title: {
    default: 'Invitations — ElarioLabs',
    template: '%s — Invitations',
  },
  description: 'Create beautiful invitations and manage your events with ElarioLabs.',
  applicationName: 'ElarioLabs Invitations',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#fffdfc',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
