import type { ReactNode } from 'react';
import Link from 'next/link';
import LanguageSwitcher from './language-switcher';
import BrandMark from './brand-mark';
import type { DashboardLocale } from '@/lib/dashboard-locale';
import {
  OverviewNavIcon,
  StudioNavIcon,
  GuestsNavIcon,
  SeatingNavIcon,
  CompatibilityNavIcon,
  LogoutNavIcon,
} from './icons';

type Section = 'overview' | 'studio' | 'guests' | 'seating' | 'compatibility';

const translations = {
  az: {
    labels: { overview: 'Ümumi baxış', studio: 'Dəvətnamə studiyası', guests: 'Qonaqlar', seating: 'Oturacaq planı', compatibility: 'Uyğunluq' },
    short: { overview: 'Baxış', studio: 'Studiya', guests: 'Qonaqlar', seating: 'Masalar', compatibility: 'Uyğunluq' },
    menu: 'Bölmələr', logout: 'Hesabdan çıxış',
  },
  ru: {
    labels: { overview: 'Обзор', studio: 'Студия приглашений', guests: 'Гости', seating: 'План рассадки', compatibility: 'Совместимость' },
    short: { overview: 'Обзор', studio: 'Студия', guests: 'Гости', seating: 'Столы', compatibility: 'Связи' },
    menu: 'Разделы', logout: 'Выйти из аккаунта',
  },
  en: {
    labels: { overview: 'Overview', studio: 'Invitation studio', guests: 'Guests', seating: 'Seating plan', compatibility: 'Compatibility' },
    short: { overview: 'Overview', studio: 'Studio', guests: 'Guests', seating: 'Tables', compatibility: 'Relations' },
    menu: 'Sections', logout: 'Sign out',
  },
};

const navIcons = {
  overview: OverviewNavIcon,
  studio: StudioNavIcon,
  guests: GuestsNavIcon,
  seating: SeatingNavIcon,
  compatibility: CompatibilityNavIcon,
} as const;

const SECTIONS: { id: Section; href: string }[] = [
  { id: 'overview', href: '/dashboard' },
  { id: 'studio', href: '/dashboard/studio' },
  { id: 'guests', href: '/dashboard/guests' },
  { id: 'seating', href: '/dashboard/seating' },
  { id: 'compatibility', href: '/dashboard/compatibility' },
];

export default function DashboardShell({
  children, active, accountName, accountEmail, locale,
}: {
  children: ReactNode;
  active: Section;
  accountName: string;
  accountEmail: string;
  locale: DashboardLocale;
}) {
  const t = translations[locale];
  const initial = accountName.trim().charAt(0).toUpperCase() || 'E';

  const logout = (className: string, withText: boolean) => (
    <form action="/api/logout" method="post">
      <button className={className} aria-label={t.logout} title={t.logout}>
        <LogoutNavIcon className="w-[18px] h-[18px]" />
        {withText && <span>{t.logout}</span>}
      </button>
    </form>
  );

  return (
    // `elario-app` keeps the --el-* variables the studio and older screens read.
    <div className="elario-app bx-app">
      <aside className="bx-rail" aria-label={t.menu}>
        <Link href="/dashboard" className="bx-rail-logo" aria-label="elario"><BrandMark size={48} id="rail" /></Link>
        <nav className="bx-rail-nav">
          {SECTIONS.map(item => {
            const Icon = navIcons[item.id];
            const current = active === item.id;
            return (
              <Link key={item.id} href={item.href} aria-current={current ? 'page' : undefined}
                className={`bx-rail-item ${current ? 'is-active' : ''}`} title={t.labels[item.id]}>
                <span className="bx-rail-icon"><Icon className="w-[22px] h-[22px]" /></span>
                <span className="bx-rail-label">{t.short[item.id]}</span>
              </Link>
            );
          })}
        </nav>
        <div className="bx-rail-foot">
          <span className="bx-avatar" title={`${accountName} · ${accountEmail}`}>{initial}</span>
          <LanguageSwitcher locale={locale} />
          {logout('bx-icon-button', false)}
        </div>
      </aside>

      <div className="bx-main">
        <header className="bx-mobilebar">
          <Link href="/dashboard" className="bx-mobilebar-brand" aria-label="elario"><BrandMark size={36} id="bar" />elario</Link>
          <div className="bx-mobilebar-actions">
            <LanguageSwitcher locale={locale} />
            {logout('bx-icon-button', false)}
          </div>
        </header>
        <main className="bx-content">{children}</main>
      </div>

      <nav className="bx-tabbar" aria-label={t.menu}>
        {SECTIONS.map(item => {
          const Icon = navIcons[item.id];
          const current = active === item.id;
          return (
            <Link key={item.id} href={item.href} aria-current={current ? 'page' : undefined}
              className={`bx-tab ${current ? 'is-active' : ''}`}>
              <Icon className="w-5 h-5" />
              <span>{t.short[item.id]}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
