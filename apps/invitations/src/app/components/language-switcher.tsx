'use client';

import { useRouter } from 'next/navigation';

export default function LanguageSwitcher({ locale }: { locale: 'az' | 'ru' | 'en' }) {
  const router = useRouter();

  function changeLanguage(value: string) {
    if (value !== 'az' && value !== 'ru' && value !== 'en') return;

    document.cookie = `invitations-dashboard-locale=${value}; path=/; max-age=31536000; samesite=lax`;
    localStorage.setItem('invitations-dashboard-locale', value);
    router.refresh();
  }

  return (
    <select
      aria-label="Interface language"
      value={locale}
      onChange={event => changeLanguage(event.target.value)}
      className="min-h-10 rounded-lg border border-[#e9e2dc] bg-white px-3 py-2 text-base font-medium text-[#746a64] md:min-h-0 md:text-xs"
    >
      <option value="az">AZ</option>
      <option value="ru">RU</option>
      <option value="en">EN</option>
    </select>
  );
}
