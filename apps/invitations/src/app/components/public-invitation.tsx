'use client';

import { useMemo } from 'react';
import InvitationView, { type InvitationData } from './invitation/invitation-view';
import type { GuestGender, GuestRsvp } from './invitation/model';

export type { Locale } from './invitation/catalog';

export type Wedding = Omit<InvitationData, 'eventDate'> & { eventDate: string };

/** Public and personal-guest invitation page. Rendering lives in ./invitation. */
export default function PublicInvitation({
  wedding,
  guestName,
  guestSlug,
  tableName,
  seatNumber,
  rsvp,
  gender,
  withFamily,
}: {
  wedding: Wedding;
  guestName?: string;
  guestSlug?: string;
  tableName?: string | null;
  seatNumber?: number | null;
  /** Personal invitations only, and only when the couple enabled RSVP for this guest. */
  rsvp?: GuestRsvp | null;
  gender?: GuestGender;
  withFamily?: boolean;
}) {
  const guest = useMemo(
    () => (guestName && guestSlug ? { name: guestName, slug: guestSlug, tableName, seatNumber, rsvp: rsvp ?? null, gender: gender ?? null, withFamily: Boolean(withFamily) } : null),
    [guestName, guestSlug, tableName, seatNumber, rsvp, gender, withFamily],
  );

  return <InvitationView data={wedding} guest={guest} mode="live" />;
}
