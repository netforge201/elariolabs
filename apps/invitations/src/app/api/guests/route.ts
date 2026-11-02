import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { currentInvitationAccount, sameOrigin } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

function slugify(value: string) {
  return value.normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 45) || 'guest';
}

export async function GET() {
  const account = await currentInvitationAccount();
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const wedding = await db.invitationWedding.findUnique({
    where: { accountId: account.id },
    select: { id: true },
  });
  if (!wedding) return NextResponse.json({ guests: [] });

  const guests = await db.invitationGuest.findMany({
    where: { weddingId: wedding.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, slug: true, createdAt: true },
  });

  return NextResponse.json({ guests });
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }

  const account = await currentInvitationAccount();
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = z.object({
    name: z.string().trim().min(1).max(160),
  }).safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: 'Enter a guest name (1–160 characters).' }, { status: 400 });
  }

  const wedding = await db.invitationWedding.findUnique({
    where: { accountId: account.id },
    select: { id: true },
  });
  if (!wedding) {
    return NextResponse.json({ error: 'Create and save the wedding first.' }, { status: 400 });
  }

  const base = slugify(parsed.data.name);
  let slug = `${base}-${randomBytes(4).toString('hex')}`;

  for (let attempt = 0; attempt < 5; attempt++) {
    const exists = await db.invitationGuest.findUnique({ where: { slug } });
    if (!exists) break;
    slug = `${base}-${randomBytes(5).toString('hex')}`;
  }

  const guest = await db.invitationGuest.create({
    data: {
      weddingId: wedding.id,
      name: parsed.data.name,
      slug,
    },
    select: { id: true, name: true, slug: true, createdAt: true },
  });

  return NextResponse.json({ guest }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }

  const account = await currentInvitationAccount();
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = z.object({ id: z.string().uuid() })
    .safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid guest ID' }, { status: 400 });
  }

  const wedding = await db.invitationWedding.findUnique({
    where: { accountId: account.id },
    select: { id: true },
  });
  if (!wedding) return NextResponse.json({ error: 'Wedding not found' }, { status: 404 });

  const result = await db.invitationGuest.deleteMany({
    where: { id: parsed.data.id, weddingId: wedding.id },
  });

  if (!result.count) {
    return NextResponse.json({ error: 'Guest not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
