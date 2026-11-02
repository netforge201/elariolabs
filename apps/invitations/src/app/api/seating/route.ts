import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { currentInvitationAccount, sameOrigin } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const objectSchema = z.object({
  id: z.string().min(1).max(80),
  type: z.enum([
    'round-table', 'rect-table', 'oval-table', 'wall', 'column',
    'door', 'window', 'stage', 'dancefloor', 'bar', 'buffet', 'entrance',
  ]),
  name: z.string().max(100),
  x: z.number().finite().min(-10000).max(10000),
  y: z.number().finite().min(-10000).max(10000),
  width: z.number().finite().min(1).max(10000),
  height: z.number().finite().min(1).max(10000),
  rotation: z.number().finite().min(-3600).max(3600),
  capacity: z.number().int().min(1).max(40).optional(),
});

const planSchema = z.object({
  version: z.literal(2),
  venue: z.object({
    width: z.number().int().min(300).max(10000),
    height: z.number().int().min(300).max(10000),
    background: z.string().max(2_100_000).nullable(),
  }),
  guestProfiles: z.record(z.string(), z.object({
    side: z.enum(['bride', 'groom', 'shared']),
    group: z.string().max(100),
    requiredNeighbors: z.array(z.string().min(1).max(80)).max(500),
    preferredNeighbors: z.array(z.string().min(1).max(80)).max(500),
    excludedNeighbors: z.array(z.string().min(1).max(80)).max(500),
    isVip: z.boolean(),
    accessibility: z.boolean(),
  })),
  guestGroups: z.array(z.object({
    id: z.string().min(1).max(80),
    name: z.string().min(1).max(100),
  })).max(200),
  objects: z.array(objectSchema).max(500),
  assignments: z.array(z.object({
    seatId: z.string().min(1).max(120),
    guestId: z.string().uuid(),
  })).max(1000),
  settings: z.object({
    gridEnabled: z.boolean(),
    snapEnabled: z.boolean(),
    gridSize: z.number().int().min(5).max(200),
  }),
});



async function getWedding(accountId: string) {
  return db.invitationWedding.findUnique({
    where: { accountId },
    select: { id: true, theme: true },
  });
}

export async function GET() {
  const account = await currentInvitationAccount();
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const wedding = await getWedding(account.id);
  if (!wedding) return NextResponse.json({ error: 'Wedding not found' }, { status: 404 });

  const theme = wedding.theme && typeof wedding.theme === 'object' && !Array.isArray(wedding.theme)
    ? wedding.theme as Record<string, unknown>
    : {};

  return NextResponse.json({ plan: theme.seatingPlan ?? null });
}

export async function PATCH(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });

  const account = await currentInvitationAccount();
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = planSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid seating plan', details: parsed.error.flatten() }, { status: 400 });
  }

  const wedding = await getWedding(account.id);
  if (!wedding) return NextResponse.json({ error: 'Wedding not found' }, { status: 404 });

  const assignments = parsed.data.assignments;
  const guestIds = assignments.map(item => item.guestId);
  const seatIds = assignments.map(item => item.seatId);

  if (new Set(guestIds).size !== guestIds.length) {
    return NextResponse.json({ error: 'A guest can only occupy one seat.' }, { status: 400 });
  }
  if (new Set(seatIds).size !== seatIds.length) {
    return NextResponse.json({ error: 'A seat can only contain one guest.' }, { status: 400 });
  }

  const tableIds = new Set(parsed.data.objects
    .filter(item => ['round-table', 'rect-table', 'oval-table'].includes(item.type))
    .map(item => item.id));

  const validSeatIds = new Set<string>();
  for (const object of parsed.data.objects) {
    if (!tableIds.has(object.id)) continue;
    const capacity = object.capacity ?? 8;
    for (let i = 0; i < capacity; i++) validSeatIds.add(`${object.id}-seat-${i}`);
  }

  if (assignments.some(item => !validSeatIds.has(item.seatId))) {
    return NextResponse.json({ error: 'Invalid seat assignment.' }, { status: 400 });
  }

  if (guestIds.length) {
    const count = await db.invitationGuest.count({
      where: { weddingId: wedding.id, id: { in: guestIds } },
    });
    if (count !== guestIds.length) {
      return NextResponse.json({ error: 'Invalid guest assignment.' }, { status: 400 });
    }
  }

  const existingTheme = wedding.theme && typeof wedding.theme === 'object' && !Array.isArray(wedding.theme)
    ? wedding.theme as Record<string, unknown>
    : {};

  await db.invitationWedding.update({
    where: { id: wedding.id },
    data: { theme: { ...existingTheme, seatingPlan: parsed.data } as never },
  });

  return NextResponse.json({ success: true, plan: parsed.data });
}
