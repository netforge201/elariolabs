import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { currentInvitationAccount } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');

  if (!origin || !host) return false;

  try {
    const parsed = new URL(origin);
    return parsed.host === host && ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

const profileSchema = z.object({
  side: z.enum(['bride', 'groom', 'shared']).default('shared'),
  isVip: z.boolean().default(false),
  group: z.string().max(100),
  requiredNeighbors: z.array(z.string().uuid()).max(500),
  preferredNeighbors: z.array(z.string().uuid()).max(500),
  excludedNeighbors: z.array(z.string().uuid()).max(500),
});

const bodySchema = z.object({
  profiles: z.record(z.string().uuid(), profileSchema),
  guestGroups: z.array(z.object({
    id: z.string().min(1).max(80),
    name: z.string().min(1).max(100),
  })).max(200),
});

async function getWedding(accountId: string) {
  return db.invitationWedding.findUnique({
    where: { accountId },
    select: { id: true, theme: true },
  });
}

export async function GET() {
  const account = await currentInvitationAccount();
  if (!account) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const wedding = await getWedding(account.id);
  if (!wedding) {
    return NextResponse.json({ error: 'Wedding not found' }, { status: 404 });
  }

  const [guests] = await Promise.all([
    db.invitationGuest.findMany({
      where: { weddingId: wedding.id },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true },
    }),
  ]);

  const theme = wedding.theme && typeof wedding.theme === 'object' && !Array.isArray(wedding.theme)
    ? wedding.theme as Record<string, unknown>
    : {};

  const plan = theme.seatingPlan && typeof theme.seatingPlan === 'object' && !Array.isArray(theme.seatingPlan)
    ? theme.seatingPlan as Record<string, unknown>
    : {};

  return NextResponse.json({
    guests,
    profiles: plan.guestProfiles ?? {},
    guestGroups: plan.guestGroups ?? [],
  });
}

export async function PATCH(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }

  const account = await currentInvitationAccount();
  if (!account) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid compatibility data' }, { status: 400 });
  }

  const wedding = await getWedding(account.id);
  if (!wedding) {
    return NextResponse.json({ error: 'Wedding not found' }, { status: 404 });
  }

  const guestIds = Object.keys(parsed.data.profiles);
  const referencedIds = new Set<string>();

  for (const [guestId, profile] of Object.entries(parsed.data.profiles)) {
    for (const id of [
      ...profile.requiredNeighbors,
      ...profile.preferredNeighbors,
      ...profile.excludedNeighbors,
    ]) {
      if (id === guestId) {
        return NextResponse.json({ error: 'A guest cannot be related to themselves.' }, { status: 400 });
      }
      referencedIds.add(id);
    }
  }

  const allIds = [...new Set([...guestIds, ...referencedIds])];

  if (allIds.length) {
    const count = await db.invitationGuest.count({
      where: { weddingId: wedding.id, id: { in: allIds } },
    });

    if (count !== allIds.length) {
      return NextResponse.json({ error: 'Invalid guest ID.' }, { status: 400 });
    }
  }

  const existingTheme = wedding.theme && typeof wedding.theme === 'object' && !Array.isArray(wedding.theme)
    ? wedding.theme as Record<string, unknown>
    : {};

  const existingPlan = existingTheme.seatingPlan &&
    typeof existingTheme.seatingPlan === 'object' &&
    !Array.isArray(existingTheme.seatingPlan)
      ? existingTheme.seatingPlan as Record<string, unknown>
      : {};

  const existingProfiles = existingPlan.guestProfiles &&
    typeof existingPlan.guestProfiles === 'object' &&
    !Array.isArray(existingPlan.guestProfiles)
      ? existingPlan.guestProfiles as Record<string, Record<string, unknown>>
      : {};

  const mergedProfiles = { ...existingProfiles };

  for (const [guestId, profile] of Object.entries(parsed.data.profiles)) {
    mergedProfiles[guestId] = {
      side: profile.side,
      group: profile.group,
      requiredNeighbors: [...new Set(profile.requiredNeighbors)],
      preferredNeighbors: [...new Set(profile.preferredNeighbors)],
      excludedNeighbors: [...new Set(profile.excludedNeighbors)],
      isVip: profile.isVip,
      accessibility: existingProfiles[guestId]?.accessibility === true,
    };
  }

  // Нормализуем отношения: для каждой пары сохраняем один общий статус.
  // При противоречии приоритет: excluded > required > preferred > none.
  const relationFields = [
    'requiredNeighbors',
    'preferredNeighbors',
    'excludedNeighbors',
  ] as const;

  function hasRelation(profile: Record<string, unknown>, field: string, id: string) {
    return Array.isArray(profile[field]) &&
      (profile[field] as unknown[]).includes(id);
  }

  for (let i = 0; i < guestIds.length; i++) {
    for (let j = i + 1; j < guestIds.length; j++) {
      const a = guestIds[i];
      const b = guestIds[j];
      const pa = mergedProfiles[a];
      const pb = mergedProfiles[b];
      if (!pa || !pb) continue;

      let relation: typeof relationFields[number] | null = null;

      for (const field of ['excludedNeighbors', 'requiredNeighbors', 'preferredNeighbors'] as const) {
        if (hasRelation(pa, field, b) || hasRelation(pb, field, a)) {
          relation = field;
          break;
        }
      }

      for (const field of relationFields) {
        pa[field] = (Array.isArray(pa[field]) ? pa[field] as string[] : []).filter(id => id !== b);
        pb[field] = (Array.isArray(pb[field]) ? pb[field] as string[] : []).filter(id => id !== a);
      }

      if (relation) {
        (pa[relation] as string[]).push(b);
        (pb[relation] as string[]).push(a);
      }
    }
  }

  const nextPlan = {
    ...existingPlan,
    guestProfiles: mergedProfiles,
    guestGroups: parsed.data.guestGroups,
  };

  await db.invitationWedding.update({
    where: { id: wedding.id },
    data: {
      theme: { ...existingTheme, seatingPlan: nextPlan } as never,
    },
  });

  return NextResponse.json({ success: true });
}
