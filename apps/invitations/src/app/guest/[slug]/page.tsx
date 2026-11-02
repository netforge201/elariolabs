import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import PublicInvitation from '@/app/components/public-invitation';
import { normalizeSeatingPlan } from '@/lib/seating-types';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

async function getGuestInvitation(slug: string) {
  const guest = await db.invitationGuest.findUnique({
    where: { slug },
    include: {
      wedding: {
        include: {
          account: {
            select: { active: true, accessExpiresAt: true },
          },
        },
      },
    },
  });

  if (!guest) return null;

  const wedding = guest.wedding;
  const account = wedding.account;

  if (
    !wedding.isPublished ||
    !wedding.eventDate ||
    !account.active ||
    (account.accessExpiresAt && account.accessExpiresAt <= new Date())
  ) {
    return null;
  }

  return { guest, wedding };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getGuestInvitation(slug);

  if (!result) return {
    title: 'Wedding Invitation',
    robots: { index: false, follow: false },
  };

  const title = `${result.wedding.partnerOne} & ${result.wedding.partnerTwo}`;

  return {
    title: `${title} — Personal Invitation`,
    description: 'A personal wedding invitation',
    robots: { index: false, follow: false },
  };
}

export default async function GuestInvitationPage({ params }: Props) {
  const { slug } = await params;
  const result = await getGuestInvitation(slug);

  if (!result) notFound();

  const { guest, wedding } = result;

  const theme = wedding.theme && typeof wedding.theme === 'object' && !Array.isArray(wedding.theme)
    ? wedding.theme as Record<string, unknown>
    : {};

  const seatingPlan = normalizeSeatingPlan(theme.seatingPlan);

  const guestAssignment = seatingPlan.assignments.find(
    assignment => assignment.guestId === guest.id
  );

  const guestTable = guestAssignment
    ? seatingPlan.objects.find(object =>
        ['round-table', 'rect-table', 'oval-table'].includes(object.type) &&
        guestAssignment.seatId.startsWith(`${object.id}-seat-`)
      )
    : null;

  return (
    <PublicInvitation
      guestName={guest.name}
      tableName={guestTable?.name ?? null}
      wedding={{
        partnerOne: wedding.partnerOne,
        partnerTwo: wedding.partnerTwo,
        eventDate: wedding.eventDate!.toISOString(),
        eventTime: wedding.eventTime,
        venueName: wedding.venueName,
        venueAddress: wedding.venueAddress,
        welcomeText: wedding.welcomeText,
        story: wedding.story,
        locale: wedding.locale,
        template: wedding.template,
      }}
    />
  );
}
