export default async function InvitationLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 py-12 text-white">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <p className="text-sm font-medium tracking-[0.3em] text-neutral-400">
            ELARIOLABS
          </p>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight">
            Invitations
          </h1>
          <p className="mt-3 text-neutral-400">
            Sign in to manage your invitations.
          </p>
        </div>

        <form
          action="/api/invitations/login"
          method="POST"
          className="space-y-5 rounded-2xl border border-neutral-800 bg-neutral-900 p-7"
        >
          {params.error && (
            <p
              role="alert"
              className="rounded-lg border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-300"
            >
              Invalid email or password, or your access has expired.
            </p>
          )}

          <div>
            <label htmlFor="email" className="mb-2 block text-sm text-neutral-300">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              maxLength={254}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none focus:border-white"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm text-neutral-300">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={200}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none focus:border-white"
              placeholder="Your password"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-white px-4 py-3 font-medium text-neutral-950 transition hover:bg-neutral-200"
          >
            Sign in
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-neutral-500">
          Invitations by ElarioLabs
        </p>
      </div>
    </main>
  );
}
