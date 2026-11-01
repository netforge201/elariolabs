import { redirect } from 'next/navigation';
import { currentInvitationAccount } from '@/lib/invitations/auth';

export const dynamic = 'force-dynamic';

export default async function InvitationDashboardPage() {
  const account = await currentInvitationAccount();

  if (!account) {
    redirect('/login');
  }

  const expiry = account.accessExpiresAt
    ? new Intl.DateTimeFormat('en', {
        dateStyle: 'long',
        timeStyle: 'short',
      }).format(account.accessExpiresAt)
    : 'Unlimited';

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-6">
          <div>
            <p className="text-xs font-medium tracking-[0.3em] text-neutral-500">
              ELARIOLABS
            </p>
            <h1 className="mt-2 text-2xl font-semibold">Invitations</h1>
          </div>

          <form action="/api/invitations/logout" method="POST">
            <button
              type="submit"
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-300 transition hover:bg-neutral-800"
            >
              Sign out
            </button>
          </form>
        </header>

        <section className="py-12">
          <p className="text-sm text-neutral-400">Welcome back</p>
          <h2 className="mt-2 text-4xl font-semibold tracking-tight">
            {account.name}
          </h2>
          <p className="mt-3 text-neutral-400">{account.email}</p>
        </section>

        <section className="grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <p className="text-sm text-neutral-400">Account status</p>
            <p className="mt-3 text-xl font-medium text-green-400">Active</p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <p className="text-sm text-neutral-400">Access expires</p>
            <p className="mt-3 text-xl font-medium">{expiry}</p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-dashed border-neutral-700 p-10 text-center">
          <h3 className="text-xl font-medium">Your invitations workspace</h3>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-neutral-400">
            Your invitation projects, designs, guest lists and RSVP management
            will appear here.
          </p>
          <p className="mt-5 text-xs tracking-wider text-neutral-500">
            WORKSPACE SETUP IN PROGRESS
          </p>
        </section>
      </div>
    </main>
  );
}
