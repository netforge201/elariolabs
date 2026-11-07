import type { ReactNode } from 'react';
import Link from 'next/link';
import LanguageSwitcher from './language-switcher';
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
    overview: 'Ümumi baxış', studio: 'Dəvətnamə studiyası', guests: 'Qonaqlar', seating: 'Oturacaq planı', compatibility: 'Uyğunluq',
    workspace: 'İŞ SAHƏSİ', logout: 'Hesabdan çıxış', subtitle: 'Wedding invitations',
    account: 'HESAB', online: 'Aktiv hesab',
    short: { overview: 'Baxış', studio: 'Studiya', guests: 'Qonaqlar', seating: 'Oturacaq', compatibility: 'Uyğunluq' },
    menu: 'Bölmələr',
  },
  ru: {
    overview: 'Обзор', studio: 'Студия приглашений', guests: 'Гости', seating: 'План рассадки', compatibility: 'Совместимость',
    workspace: 'РАБОЧЕЕ ПРОСТРАНСТВО', logout: 'Выйти из аккаунта',
    subtitle: 'Wedding invitations', account: 'АККАУНТ', online: 'Аккаунт активен',
    short: { overview: 'Обзор', studio: 'Студия', guests: 'Гости', seating: 'Рассадка', compatibility: 'Связи' },
    menu: 'Разделы',
  },
  en: {
    overview: 'Overview', studio: 'Invitation studio', guests: 'Guests', seating: 'Seating plan', compatibility: 'Compatibility',
    workspace: 'WORKSPACE', logout: 'Sign out', subtitle: 'Wedding invitations',
    account: 'ACCOUNT', online: 'Account active',
    short: { overview: 'Overview', studio: 'Studio', guests: 'Guests', seating: 'Seating', compatibility: 'Relations' },
    menu: 'Sections',
  },
};

const navIcons = {
  overview: OverviewNavIcon,
  studio: StudioNavIcon,
  guests: GuestsNavIcon,
  seating: SeatingNavIcon,
  compatibility: CompatibilityNavIcon,
} as const;

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
  const items = [
    { id: 'overview', href: '/dashboard', label: t.overview, number: '01' },
    { id: 'studio', href: '/dashboard/studio', label: t.studio, number: '02' },
    { id: 'guests', href: '/dashboard/guests', label: t.guests, number: '03' },
    { id: 'seating', href: '/dashboard/seating', label: t.seating, number: '04' },
    { id: 'compatibility', href: '/dashboard/compatibility', label: t.compatibility, number: '05' },
  ] as const;

  return (
    <div className="elario-app min-h-screen md:flex">
      <header className="elario-mobilebar">
        <Link href="/dashboard" className="elario-mobilebar-brand" aria-label="elario">elario<span>.</span></Link>
        <div className="elario-mobilebar-actions">
          <LanguageSwitcher locale={locale} />
          <form action="/api/logout" method="post">
            <button className="elario-mobilebar-logout" aria-label={t.logout} title={t.logout}>
              <LogoutNavIcon className="w-4 h-4" />
            </button>
          </form>
        </div>
      </header>

      <aside className="elario-sidebar">
        <Link href="/dashboard" className="elario-brand">
          <span className="elario-brand-name">elario<span>.</span></span>
          <span className="elario-brand-caption">WEDDING INVITATIONS</span>
        </Link>

        <div className="elario-nav-label">{t.workspace}</div>
        <nav className="elario-navigation">
          {items.map(item => {
            const Icon = navIcons[item.id];
            return (
              <Link key={item.id} href={item.href}
                aria-current={active === item.id ? 'page' : undefined}
                className={`elario-nav-item ${active === item.id ? 'active' : ''}`}>
                <span className="elario-nav-icon"><Icon className="w-4 h-4" /></span>
                <span>{item.label}</span>
                <small>{item.number}</small>
              </Link>
            );
          })}
        </nav>

        <div className="elario-sidebar-bottom">
          <div className="elario-account-label">{t.account}</div>
          <div className="elario-account">
            <div className="elario-avatar">{accountName.trim().charAt(0).toUpperCase()}</div>
            <div className="elario-account-info">
              <strong>{accountName}</strong>
              <span>{accountEmail}</span>
            </div>
          </div>
          <form action="/api/logout" method="post">
            <button className="elario-logout">{t.logout} <LogoutNavIcon className="w-3.5 h-3.5 inline-block" /></button>
          </form>
        </div>
      </aside>

      <div className="elario-main">
        <header className="elario-topbar">
          <div className="elario-topbar-brand">
            <span>ELARIO</span>
            <i>/</i>
            <span>{t.subtitle}</span>
          </div>
          <div className="elario-topbar-right">
            <span className="elario-account-state"><i />{t.online}</span>
            <LanguageSwitcher locale={locale} />
          </div>
        </header>
        <main className="elario-content">{children}</main>
        <footer className="elario-footer">
          <span>ELARIO WEDDING INVITATIONS</span>
          <span>MADE FOR YOUR STORY</span>
        </footer>
      </div>

      <nav className="elario-tabbar" aria-label={t.menu}>
        {items.map(item => {
          const Icon = navIcons[item.id];
          const current = active === item.id;
          return (
            <Link key={item.id} href={item.href} aria-current={current ? 'page' : undefined}
              className={`elario-tab ${current ? 'active' : ''}`}>
              <span className="elario-tab-icon"><Icon className="w-5 h-5" /></span>
              <span className="elario-tab-label">{t.short[item.id]}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
