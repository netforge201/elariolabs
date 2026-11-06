import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import PublicInvitation from '../components/public-invitation';

type Props = { params: Promise<{ slug: string }> };

async function getWedding(slug: string) {
  const wedding = await db.invitationWedding.findUnique({ where: { slug } });
  if (!wedding || !wedding.isPublished || !wedding.eventDate) return null;

  const account = await db.invitationAccount.findUnique({
    where: { id: wedding.accountId },
    select: { active: true, accessExpiresAt: true },
  });

  if (!account || !account.active ||
      (account.accessExpiresAt && account.accessExpiresAt < new Date())) return null;

  return wedding;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const wedding = await getWedding(slug);
  if (!wedding) return { title: 'Invitation' };

  const title = `${wedding.partnerOne} & ${wedding.partnerTwo}`;
  return {
    title: `${title} — Wedding Invitation`,
    description: wedding.welcomeText || `Wedding invitation for ${title}`,
    openGraph: { title, description: wedding.welcomeText || 'Wedding invitation' },
  };
}

export const dynamic = 'force-dynamic';

export default async function PublicWeddingPage({ params }: Props) {
  const { slug } = await params;
  const wedding = await getWedding(slug);
  if (!wedding) notFound();

  const theme = wedding.theme && typeof wedding.theme === 'object' && !Array.isArray(wedding.theme)
    ? wedding.theme as Record<string, unknown>
    : {};

  return <PublicInvitation wedding={{
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
    music: typeof theme.music === 'string' ? theme.music : null,
    timezone: wedding.timezone,
  }} />;
}
