import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sameOrigin } from '@/lib/auth';
import { db } from '@/lib/db';
import { eventInstant } from '@/app/components/invitation/event-time';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DAY_MS = 24 * 60 * 60 * 1000;

const schema = z.object({
  slug: z.string().trim().min(1).max(200),
  attending: z.boolean(),
  guests: z.number().int().min(1).max(20).optional(),
  note: z.string().trim().max(500).optional(),
});

/**
 * A guest answers the RSVP on their personal invitation. Accepted only when the
 * couple switched RSVP on for that guest, the invitation is live, and the
 * wedding day has not passed. The guest may change the answer until then.
 */
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin', code: 'origin' }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid answer', code: 'invalid' }, { status: 400 });
  }
  const { slug, attending, guests, note } = parsed.data;

  const guest = await db.invitationGuest.findUnique({
    where: { slug },
    select: {
      id: true,
      rsvpEnabled: true,
      wedding: {
        select: {
          isPublished: true, eventDate: true, eventTime: true, timezone: true,
          account: { select: { active: true, accessExpiresAt: true } },
        },
      },
    },
  });

  const wedding = guest?.wedding;
  const live = wedding
    && wedding.isPublished
    && wedding.eventDate
    && wedding.account.active
    && (!wedding.account.accessExpiresAt || wedding.account.accessExpiresAt > new Date());
  if (!guest || !live || !guest.rsvpEnabled) {
    return NextResponse.json({ error: 'RSVP is not available', code: 'unavailable' }, { status: 404 });
  }

  const start = eventInstant(wedding.eventDate!.toISOString().slice(0, 10), wedding.eventTime, wedding.timezone || 'Asia/Baku');
  if (Date.now() > start.getTime() + DAY_MS) {
    return NextResponse.json({ error: 'RSVP is closed', code: 'closed' }, { status: 409 });
  }

  const saved = await db.invitationGuest.update({
    where: { id: guest.id },
    data: {
      rsvpStatus: attending ? 'yes' : 'no',
      rsvpGuests: attending ? (guests ?? 1) : null,
      rsvpNote: note ? note : null,
      rsvpAt: new Date(),
    },
    select: { rsvpStatus: true, rsvpGuests: true, rsvpNote: true },
  });

  return NextResponse.json({
    rsvp: { status: saved.rsvpStatus, guests: saved.rsvpGuests, note: saved.rsvpNote },
  });
}
