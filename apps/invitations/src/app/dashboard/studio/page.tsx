import { redirect } from 'next/navigation';
import { currentInvitationAccount } from '@/lib/auth';
import { db } from '@/lib/db';
import WeddingEditor from '@/app/components/wedding-editor';
import DashboardShell from '@/app/components/dashboard-shell';
import { getDashboardLocale } from '@/lib/dashboard-locale';

export const dynamic = 'force-dynamic';

export default async function StudioPage() {
  const account = await currentInvitationAccount();
  if (!account) redirect('/login');

  const locale = await getDashboardLocale();

  const wedding = await db.invitationWedding.findUnique({
    where: { accountId: account.id },
  });

  return (
    <DashboardShell
      active="studio"
      accountName={account.name}
      accountEmail={account.email}
      locale={locale}
    >
      <WeddingEditor
        accountName={account.name}
        accountEmail={account.email}
        initialWedding={wedding ? {
          ...wedding,
          eventDate: wedding.eventDate?.toISOString() ?? null,
        } : null}
      />
    </DashboardShell>
  );
}
