import { redirect } from 'next/navigation';
import { currentInvitationAccount } from '@/lib/auth';

export const metadata = { title: 'Sign in' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const account = await currentInvitationAccount();
  if (account) redirect('/dashboard');

  const params = await searchParams;
  const hasError = Boolean(params.error);

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-[0_20px_80px_rgba(50,35,45,0.08)] md:grid-cols-2">
        <section className="flex flex-col justify-between bg-[#eee5e9] p-9 md:p-12">
          <div className="text-sm font-semibold tracking-[0.22em] text-[#796475]">ELARIOLABS</div>
          <div className="my-16">
            <div className="mb-6 text-xs uppercase tracking-[0.3em] text-[#90798a]">A new beginning</div>
            <h1 className="max-w-sm font-serif text-5xl leading-[1.12] text-[#41343f]">
              Every special moment deserves a beautiful invitation.
            </h1>
            <p className="mt-6 max-w-sm text-sm leading-7 text-[#796d77]">
              Your personal space to create, share and manage memorable events.
            </p>
          </div>
          <div className="text-xs text-[#968794]">Thoughtfully made by ElarioLabs</div>
        </section>

        <section className="flex flex-col justify-center p-8 md:p-14">
          <div className="mb-10">
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#a88a9c]">Welcome back</div>
            <h2 className="font-serif text-4xl text-[#292630]">Sign in</h2>
            <p className="mt-3 text-sm leading-6 text-[#85818d]">
              Enter the account details provided to you.
            </p>
          </div>

          {hasError && (
            <div role="alert" className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              Unable to sign in. Check your email and password or contact your administrator.
            </div>
          )}

          <form action="/api/login" method="POST" className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#494550]">Email address</span>
              <input
                type="email"
                name="email"
                required
                autoComplete="username"
                placeholder="you@example.com"
                className="w-full rounded-xl border border-[#e9e5e9] bg-white px-4 py-3.5 text-sm outline-none transition focus:border-[#b89eae] focus:ring-4 focus:ring-[#b89eae]/10"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#494550]">Password</span>
              <input
                type="password"
                name="password"
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                className="w-full rounded-xl border border-[#e9e5e9] bg-white px-4 py-3.5 text-sm outline-none transition focus:border-[#b89eae] focus:ring-4 focus:ring-[#b89eae]/10"
              />
            </label>

            <button className="w-full rounded-xl bg-[#8f7487] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#796174]">
              Sign in to your account
            </button>
          </form>

          <p className="mt-8 text-center text-xs leading-6 text-[#a09aa3]">
            Access is provided by your administrator.
            <br />Public registration is not available.
          </p>
        </section>
      </div>
    </main>
  );
}
