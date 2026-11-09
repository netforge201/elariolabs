import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { currentInvitationAccount, sameOrigin } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const schema = z.union([
  z.object({ id: z.string().uuid(), enabled: z.boolean() }),
  z.object({ all: z.literal(true), enabled: z.boolean() }),
]);

/**
 * Switches the RSVP form on or off on personal invitations — for one guest or
 * for all of them. Answers already given are kept either way.
 */
export async function PATCH(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }
  const account = await currentInvitationAccount();
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const wedding = await db.invitationWedding.findUnique({ where: { accountId: account.id }, select: { id: true } });
  if (!wedding) return NextResponse.json({ error: 'Wedding not found' }, { status: 404 });

  const where = 'id' in parsed.data
    ? { id: parsed.data.id, weddingId: wedding.id }
    : { weddingId: wedding.id };
  const result = await db.invitationGuest.updateMany({ where, data: { rsvpEnabled: parsed.data.enabled } });

  if ('id' in parsed.data && !result.count) {
    return NextResponse.json({ error: 'Guest not found' }, { status: 404 });
  }
  return NextResponse.json({ updated: result.count, enabled: parsed.data.enabled });
}
