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

  let tableName: string | null = null;
  let seatNumber: number | null = null;

  if (guestAssignment) {
    const match = guestAssignment.seatId.match(/^(.*)-seat-(\d+)$/);
    const tableId = match ? match[1] : null;
    const table = tableId
      ? seatingPlan.objects.find(obj => obj.id === tableId)
      : seatingPlan.objects.find(obj =>
          ['round-table', 'rect-table', 'oval-table'].includes(obj.type) &&
          guestAssignment.seatId.startsWith(`${obj.id}-seat-`)
        );

    if (table) {
      tableName = table.name;
      if (match) {
        seatNumber = Number(match[2]) + 1;
      }
    }
  }

  return (
    <PublicInvitation
      guestName={guest.name}
      guestSlug={guest.slug}
      tableName={tableName}
      seatNumber={seatNumber}
      wedding={{
        slug: wedding.slug,
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
        coverImage: typeof theme.coverImage === 'string' ? theme.coverImage : null,
      }}
    />
  );
}
