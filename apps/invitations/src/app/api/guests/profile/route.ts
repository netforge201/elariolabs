import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { currentInvitationAccount, sameOrigin } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const schema = z.object({
  id: z.string().uuid(),
  /** The couple's own label for the guest (lists, seating, search). */
  name: z.string().trim().min(1).max(160),
  /** Printed on the invitation; empty → the label above is used. */
  inviteName: z.string().trim().max(160).nullable(),
  gender: z.enum(['male', 'female']).nullable(),
  withFamily: z.boolean(),
});

/** Saves how one guest is named and addressed. Nothing else is touched. */
export async function PATCH(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }
  const account = await currentInvitationAccount();
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid guest details' }, { status: 400 });

  const wedding = await db.invitationWedding.findUnique({ where: { accountId: account.id }, select: { id: true } });
  if (!wedding) return NextResponse.json({ error: 'Wedding not found' }, { status: 404 });

  const { id, name, inviteName, gender, withFamily } = parsed.data;
  const result = await db.invitationGuest.updateMany({
    where: { id, weddingId: wedding.id },
    data: { name, inviteName: inviteName || null, gender, withFamily },
  });
  if (!result.count) return NextResponse.json({ error: 'Guest not found' }, { status: 404 });

  return NextResponse.json({ guest: { id, name, inviteName: inviteName || null, gender, withFamily } });
}
