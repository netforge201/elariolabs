import { redirect } from 'next/navigation';
import { currentAdmin } from '@/lib/auth';
import { AdminPasswordForm } from './password-form';

export const dynamic = 'force-dynamic';

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; changed?: string }>;
}) {
  const user = await currentAdmin();
  if (!user) redirect('/admin/login');

  const query = await searchParams;
  if (!user.mustChangePassword && !query.changed) redirect('/admin');

  return (
    <main className="admin-auth">
      <a className="wordmark" href="/">ElarioLabs.</a>
      <section className="card" style={{ marginTop: '2rem' }}>
        <span className="eyebrow">Account security</span>
        <h1 style={{ fontSize: '2rem', marginTop: '.5rem' }}>
          {query.changed ? 'Password updated' : 'Change your password'}
        </h1>
        {query.changed ? (
          <>
            <p>Your password has been changed. Sign in with your new password to continue.</p>
            <a className="btn-primary" href="/api/admin/logout">Continue to sign in</a>
          </>
        ) : (
          <>
            <p>You must choose a new password before accessing the administration area.</p>
            {query.error && <p className="error" role="alert">Passwords must match and be at least 14 characters long. Your current password must also be correct.</p>}
            <AdminPasswordForm />
          </>
        )}
      </section>
    </main>
  );
}
