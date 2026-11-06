'use client';

import { useMemo } from 'react';
import InvitationView, { type InvitationData } from './invitation/invitation-view';

export type { Locale } from './invitation/catalog';

export type Wedding = Omit<InvitationData, 'eventDate'> & { eventDate: string };

/** Public and personal-guest invitation page. Rendering lives in ./invitation. */
export default function PublicInvitation({
  wedding,
  guestName,
  guestSlug,
  tableName,
  seatNumber,
}: {
  wedding: Wedding;
  guestName?: string;
  guestSlug?: string;
  tableName?: string | null;
  seatNumber?: number | null;
}) {
  const guest = useMemo(
    () => (guestName && guestSlug ? { name: guestName, slug: guestSlug, tableName, seatNumber } : null),
    [guestName, guestSlug, tableName, seatNumber],
  );

  return <InvitationView data={wedding} guest={guest} mode="live" />;
}
