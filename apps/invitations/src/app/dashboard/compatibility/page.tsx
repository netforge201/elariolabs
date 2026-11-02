import { redirect } from 'next/navigation';
import { currentInvitationAccount } from '@/lib/auth';
import { db } from '@/lib/db';
import DashboardShell from '@/app/components/dashboard-shell';
import { getDashboardLocale } from '@/lib/dashboard-locale';
import CompatibilityManager from '@/app/components/guest-compatibility-manager';
import { normalizeSeatingPlan } from '@/lib/seating-types';

export const dynamic = 'force-dynamic';

export default async function CompatibilityPage() {
  const account = await currentInvitationAccount();
  if (!account) redirect('/login');

  const locale = await getDashboardLocale();

  const wedding = await db.invitationWedding.findUnique({
    where: { accountId: account.id },
    select: { id: true, theme: true },
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

  const plan = normalizeSeatingPlan(theme.seatingPlan);

  return (
    <DashboardShell
      active="compatibility"
      accountName={account.name}
      accountEmail={account.email}
      locale={locale}
    >
      <CompatibilityManager
        locale={locale}
        guests={guests}
        initialProfiles={plan.guestProfiles}
        initialGroups={plan.guestGroups}
      />
    </DashboardShell>
  );
}
