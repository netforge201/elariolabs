import { redirect } from 'next/navigation';
import { currentInvitationAccount } from '@/lib/auth';
import { getDashboardLocale } from '@/lib/dashboard-locale';
import LanguageSwitcher from '@/app/components/language-switcher';
import DashboardFonts from '@/app/components/dashboard-fonts';
import type { Viewport } from 'next';

export const metadata = { title: 'Sign in' };
export const viewport: Viewport = { themeColor: '#e9efe6' };

const copy = {
  az: {
    kicker: 'Yeni başlanğıc', headline: 'Hər xüsusi an gözəl dəvətnaməyə layiqdir.',
    lead: 'Tədbirlərinizi yaratmaq, paylaşmaq və idarə etmək üçün şəxsi məkanınız.', madeBy: 'ElarioLabs tərəfindən hazırlanıb',
    welcome: 'Xoş gəldiniz', title: 'Daxil olun', intro: 'Sizə verilmiş hesab məlumatlarını daxil edin.',
    error: 'Daxil olmaq alınmadı. E-poçtu və şifrəni yoxlayın və ya administratorla əlaqə saxlayın.',
    email: 'E-poçt ünvanı', password: 'Şifrə', passwordPlaceholder: 'Şifrənizi daxil edin', submit: 'Hesaba daxil ol',
    note: 'Giriş administrator tərəfindən verilir.', noteTwo: 'Açıq qeydiyyat mövcud deyil.',
  },
  ru: {
    kicker: 'Новое начало', headline: 'Каждый особенный момент достоин красивого приглашения.',
    lead: 'Ваше личное пространство, чтобы создавать, делиться и управлять событиями.', madeBy: 'Сделано ElarioLabs',
    welcome: 'С возвращением', title: 'Вход', intro: 'Введите данные аккаунта, которые вам выдали.',
    error: 'Не удалось войти. Проверьте e-mail и пароль или свяжитесь с администратором.',
    email: 'E-mail', password: 'Пароль', passwordPlaceholder: 'Введите пароль', submit: 'Войти в аккаунт',
    note: 'Доступ выдаёт администратор.', noteTwo: 'Открытой регистрации нет.',
  },
  en: {
    kicker: 'A new beginning', headline: 'Every special moment deserves a beautiful invitation.',
    lead: 'Your personal space to create, share and manage memorable events.', madeBy: 'Thoughtfully made by ElarioLabs',
    welcome: 'Welcome back', title: 'Sign in', intro: 'Enter the account details provided to you.',
    error: 'Unable to sign in. Check your email and password or contact your administrator.',
    email: 'Email address', password: 'Password', passwordPlaceholder: 'Enter your password', submit: 'Sign in to your account',
    note: 'Access is provided by your administrator.', noteTwo: 'Public registration is not available.',
  },
};

const inputClass = 'w-full rounded-xl border border-[#dce5de] bg-white px-4 py-3.5 text-base md:text-sm outline-none transition focus:border-[#1f3a2e] focus:ring-4 focus:ring-[#1f3a2e]/10';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const account = await currentInvitationAccount();
  if (account) redirect('/dashboard');

  const params = await searchParams;
  const hasError = Boolean(params.error);
  const locale = await getDashboardLocale();
  const t = copy[locale];

  return (
    <>
    <DashboardFonts />
    <main className="login-page flex min-h-screen bg-[#e9efe6] font-[family-name:var(--font-dm)] items-center justify-center px-4 py-6 md:px-5 md:py-12">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[24px] bg-white shadow-[0_20px_60px_rgba(31,58,46,0.12)] md:rounded-[28px] md:grid-cols-2">
        <section className="flex flex-col justify-between bg-[#1f3a2e] px-6 py-6 md:p-12">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm font-semibold tracking-[0.22em] text-white">ELARIOLABS</div>
            <div className="md:hidden"><LanguageSwitcher locale={locale} /></div>
          </div>
          <div className="mt-6 md:my-16">
            <div className="mb-3 text-xs uppercase tracking-[0.3em] text-[#cfe0d5] md:mb-6">{t.kicker}</div>
            <h1 className="max-w-sm font-[family-name:var(--font-sora)] text-[28px] font-bold leading-[1.15] tracking-[-0.02em] text-white md:text-5xl md:leading-[1.1]">
              {t.headline}
            </h1>
            <p className="mt-6 hidden max-w-sm text-sm leading-7 text-[#cfe0d5] md:block">{t.lead}</p>
          </div>
          <div className="hidden text-xs text-[#cfe0d5] md:block">{t.madeBy}</div>
        </section>

        <section className="flex flex-col justify-center px-6 py-8 md:p-14">
          <div className="mb-8 flex items-start justify-between gap-4 md:mb-10">
            <div>
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#4d6358]">{t.welcome}</div>
              <h2 className="font-[family-name:var(--font-sora)] text-4xl font-bold tracking-[-0.02em] text-[#1f3a2e]">{t.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[#4d6358]">{t.intro}</p>
            </div>
            <div className="hidden md:block"><LanguageSwitcher locale={locale} /></div>
          </div>

          {hasError && (
            <div role="alert" className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{t.error}</div>
          )}

          <form action="/api/login" method="POST" className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#1f3a2e]">{t.email}</span>
              <input type="email" name="email" required autoComplete="username" inputMode="email"
                autoCapitalize="none" autoCorrect="off" spellCheck={false}
                placeholder="you@example.com" className={inputClass} />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#1f3a2e]">{t.password}</span>
              <input type="password" name="password" required autoComplete="current-password"
                placeholder={t.passwordPlaceholder} className={inputClass} />
            </label>

            <button className="min-h-[52px] w-full rounded-xl bg-[#1f3a2e] px-5 py-4 text-base font-bold text-white transition hover:bg-[#2b4d3d] md:text-sm">
              {t.submit}
            </button>
          </form>

          <p className="mt-8 text-center text-xs leading-6 text-[#4d6358]">
            {t.note}
            <br />{t.noteTwo}
          </p>
        </section>
      </div>
    </main>
    </>
  );
}
