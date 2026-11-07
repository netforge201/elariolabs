import type { Viewport } from 'next';
import DashboardFonts from '@/app/components/dashboard-fonts';

// Browser chrome matches the dashboard's sage background.
export const viewport: Viewport = { themeColor: '#e9efe6' };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DashboardFonts />
      {children}
    </>
  );
}
