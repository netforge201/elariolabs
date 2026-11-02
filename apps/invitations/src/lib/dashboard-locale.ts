import { cookies } from 'next/headers';

export type DashboardLocale = 'az' | 'ru' | 'en';

export async function getDashboardLocale(): Promise<DashboardLocale> {
  const store = await cookies();
  const value = store.get('invitations-dashboard-locale')?.value;
  return value === 'ru' || value === 'en' ? value : 'az';
}
