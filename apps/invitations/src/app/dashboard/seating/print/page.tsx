import { redirect } from 'next/navigation';
import { currentInvitationAccount } from '@/lib/auth';
import { db } from '@/lib/db';
import { normalizeSeatingPlan } from '@/lib/seating-types';
import { getDashboardLocale } from '@/lib/dashboard-locale';
import SeatingPrintReport from '@/app/components/seating-print-report';
import { parsePrintOptions } from '@/app/components/seating-print-options';
import { resolveLocale } from '@/app/components/invitation/catalog';

export const dynamic = 'force-dynamic';

export default async function SeatingPrintPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const account = await currentInvitationAccount();
  if (!account) redirect('/login');

  const locale = await getDashboardLocale();

  const wedding = await db.invitationWedding.findUnique({
    where: { accountId: account.id },
    select: {
      id: true, partnerOne: true, partnerTwo: true, theme: true,
      eventDate: true, eventTime: true, venueName: true, locale: true,
    },
  });

  if (!wedding) redirect('/dashboard/studio');

  const guests = await db.invitationGuest.findMany({
    where: { weddingId: wedding.id },
    orderBy: { name: 'asc' },
    select: {
      id: true, name: true, inviteName: true, gender: true, withFamily: true,
      rsvpEnabled: true, rsvpStatus: true, rsvpGuests: true,
    },
  });

  const theme = wedding.theme && typeof wedding.theme === 'object' && !Array.isArray(wedding.theme)
    ? wedding.theme as Record<string, unknown>
    : {};

  const hasRsvp = guests.some(guest => guest.rsvpEnabled);

  return (
    <SeatingPrintReport
      locale={locale}
      inviteLocale={resolveLocale(wedding.locale)}
      couple={`${wedding.partnerOne} & ${wedding.partnerTwo}`}
      eventDay={wedding.eventDate ? wedding.eventDate.toISOString().slice(0, 10) : null}
      eventTime={wedding.eventTime}
      venueName={wedding.venueName}
      guests={guests.map(guest => ({
        id: guest.id,
        name: guest.name,
        inviteName: guest.inviteName,
        gender: guest.gender === 'male' || guest.gender === 'female' ? guest.gender : null,
        withFamily: guest.withFamily,
        rsvpEnabled: guest.rsvpEnabled,
        rsvpStatus: guest.rsvpStatus === 'yes' || guest.rsvpStatus === 'no' ? guest.rsvpStatus : null,
        rsvpGuests: guest.rsvpGuests,
      }))}
      plan={normalizeSeatingPlan(theme.seatingPlan)}
      initialOptions={parsePrintOptions(await searchParams, hasRsvp)}
    />
  );
}
