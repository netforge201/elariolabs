import { redirect } from 'next/navigation';
import { currentInvitationAccount } from '@/lib/auth';
import { db } from '@/lib/db';
import DashboardShell from '@/app/components/dashboard-shell';
import { getDashboardLocale } from '@/lib/dashboard-locale';
import SeatingPlanner from '@/app/components/seating-planner';
import { normalizeSeatingPlan } from '@/lib/seating-types';

export const dynamic = 'force-dynamic';

export default async function SeatingPage() {
  const account = await currentInvitationAccount();
  if (!account) redirect('/login');

  const locale = await getDashboardLocale();
  const wedding = await db.invitationWedding.findUnique({
    where: { accountId: account.id },
    select: { id: true, partnerOne: true, partnerTwo: true, theme: true },
  });

  if (!wedding) redirect('/dashboard/studio');

  const guests = await db.invitationGuest.findMany({
    where: { weddingId: wedding.id },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true },
  });

  const theme = wedding.theme && typeof wedding.theme === 'object' && !Array.isArray(wedding.theme)
    ? wedding.theme as Record<string, unknown>
    : {};

  return (
    <DashboardShell active="seating" accountName={account.name} accountEmail={account.email} locale={locale}>
      <SeatingPlanner
        locale={locale}
        couple={`${wedding.partnerOne} & ${wedding.partnerTwo}`}
        guests={guests}
        initialPlan={normalizeSeatingPlan(theme.seatingPlan)}
      />
    </DashboardShell>
  );
}
