import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { currentInvitationAccount, sameOrigin } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

function normalizeName(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase();
}

function slugify(value: string) {
  return value.normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 45) || 'guest';
}

const importSchema = z.object({
  names: z.array(z.string().trim().min(1).max(160)).min(1).max(500),
});

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }

  const account = await currentInvitationAccount();

  if (!account) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = importSchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Expected between 1 and 500 guest names, each 1–160 characters.' },
      { status: 400 },
    );
  }

  const wedding = await db.invitationWedding.findUnique({
    where: { accountId: account.id },
    select: { id: true },
  });

  if (!wedding) {
    return NextResponse.json(
      { error: 'Create and save the wedding first.' },
      { status: 400 },
    );
  }

  const uniqueNames = new Map<string, string>();
  let skippedDuplicates = 0;

  for (const rawName of parsed.data.names) {
    const name = rawName.replace(/\s+/g, ' ').trim();
    const normalized = normalizeName(name);

    if (!normalized || uniqueNames.has(normalized)) {
      skippedDuplicates++;
      continue;
    }

    uniqueNames.set(normalized, name);
  }

  const existingGuests = await db.invitationGuest.findMany({
    where: { weddingId: wedding.id },
    select: { name: true },
  });

  const existingNames = new Set(
    existingGuests.map((guest) => normalizeName(guest.name)),
  );

  const newGuests: { weddingId: string; name: string; slug: string }[] = [];

  for (const [normalized, name] of uniqueNames) {
    if (existingNames.has(normalized)) {
      skippedDuplicates++;
      continue;
    }

    const base = slugify(name);

    newGuests.push({
      weddingId: wedding.id,
      name,
      slug: `${base}-${randomBytes(8).toString('hex')}`,
    });
  }

  if (newGuests.length === 0) {
    return NextResponse.json({
      guests: [],
      imported: 0,
      skippedDuplicates,
    });
  }

  await db.invitationGuest.createMany({
    data: newGuests,
  });

  const createdGuests = await db.invitationGuest.findMany({
    where: {
      weddingId: wedding.id,
      slug: { in: newGuests.map((guest) => guest.slug) },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    guests: createdGuests,
    imported: createdGuests.length,
    skippedDuplicates,
  }, { status: 201 });
}
