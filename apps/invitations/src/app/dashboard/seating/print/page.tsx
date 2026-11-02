import { redirect } from 'next/navigation';
import { currentInvitationAccount } from '@/lib/auth';
import { db } from '@/lib/db';
import { normalizeSeatingPlan } from '@/lib/seating-types';
import { getDashboardLocale } from '@/lib/dashboard-locale';
import SeatingPrintReport from '@/app/components/seating-print-report';

export const dynamic = 'force-dynamic';

export default async function SeatingPrintPage() {
  const account = await currentInvitationAccount();
  if (!account) redirect('/login');

  const locale = await getDashboardLocale();

  const wedding = await db.invitationWedding.findUnique({
    where: { accountId: account.id },
    select: {
      id: true,
      partnerOne: true,
      partnerTwo: true,
      theme: true,
    },
  });

  if (!wedding) redirect('/dashboard/studio');

  const guests = await db.invitationGuest.findMany({
    where: { weddingId: wedding.id },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });

  const theme = wedding.theme && typeof wedding.theme === 'object' && !Array.isArray(wedding.theme)
    ? wedding.theme as Record<string, unknown>
    : {};

  return (
    <SeatingPrintReport
      locale={locale}
      couple={`${wedding.partnerOne} & ${wedding.partnerTwo}`}
      guests={guests}
      plan={normalizeSeatingPlan(theme.seatingPlan)}
    />
  );
}
