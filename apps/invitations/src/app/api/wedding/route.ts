import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { currentInvitationAccount, sameOrigin } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const weddingSchema = z.object({
  partnerOne: z.string().trim().min(1).max(100),
  partnerTwo: z.string().trim().min(1).max(100),
  eventDate: z.string().date().nullable().optional(),
  eventTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
  venueName: z.string().trim().max(200).nullable().optional(),
  venueAddress: z.string().trim().max(500).nullable().optional(),
  welcomeText: z.string().max(5000).nullable().optional(),
  story: z.string().max(10000).nullable().optional(),
  locale: z.enum(['az', 'ru', 'en']).optional(),
  template: z.enum(['elegant', 'soft-colorful', 'azeri', 'minimal', 'botanical', 'romantic', 'classic']).optional(),
  isPublished: z.boolean().optional(),
});

const updateSchema = weddingSchema.partial().strict();



function slugify(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) || 'wedding';
}

export async function GET() {
  const account = await currentInvitationAccount();
  if (!account) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const wedding = await db.invitationWedding.findUnique({
    where: { accountId: account.id },
  });

  return NextResponse.json({ wedding });
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }

  const account = await currentInvitationAccount();
  if (!account) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const existing = await db.invitationWedding.findUnique({
    where: { accountId: account.id },
  });

  if (existing) {
    return NextResponse.json(
      { error: 'Wedding already exists', wedding: existing },
      { status: 409 },
    );
  }

  const parsed = weddingSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid wedding data', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const baseSlug = slugify(`${data.partnerOne}-${data.partnerTwo}`);

  let slug = baseSlug;
  for (let attempt = 0; attempt < 5; attempt++) {
    const exists = await db.invitationWedding.findUnique({ where: { slug } });
    if (!exists) break;
    slug = `${baseSlug}-${randomBytes(3).toString('hex')}`;
  }

  const wedding = await db.invitationWedding.create({
    data: {
      accountId: account.id,
      slug,
      partnerOne: data.partnerOne,
      partnerTwo: data.partnerTwo,
      eventDate: data.eventDate ? new Date(`${data.eventDate}T00:00:00.000Z`) : null,
      eventTime: data.eventTime ?? null,
      venueName: data.venueName ?? null,
      venueAddress: data.venueAddress ?? null,
      welcomeText: data.welcomeText ?? null,
      story: data.story ?? null,
      locale: data.locale ?? 'az',
      template: data.template ?? 'elegant',
    },
  });

  return NextResponse.json({ wedding }, { status: 201 });
}


export async function PATCH(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }

  const account = await currentInvitationAccount();
  if (!account) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({
      error: 'Invalid wedding data',
      details: parsed.error.flatten(),
    }, { status: 400 });
  }

  const data = parsed.data;
  const keys = Object.keys(data);
  if (keys.length === 0) {
    return NextResponse.json({
      error: 'No editable fields received',
      received: Object.keys(body as Record<string, unknown>),
    }, { status: 400 });
  }

  const existing = await db.invitationWedding.findUnique({
    where: { accountId: account.id },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Wedding not found' }, { status: 404 });
  }

  const candidate = { ...existing, ...data };

  if (data.isPublished === true) {
    if (
      !candidate.partnerOne?.trim() ||
      !candidate.partnerTwo?.trim() ||
      !candidate.eventDate ||
      !candidate.eventTime?.trim() ||
      !candidate.venueName?.trim()
    ) {
      return NextResponse.json({
        error: 'Publishing requires both names, date, time and venue.',
      }, { status: 400 });
    }
  }

  const wedding = await db.invitationWedding.update({
    where: { id: existing.id },
    data: {
      ...(data.partnerOne !== undefined && { partnerOne: data.partnerOne }),
      ...(data.partnerTwo !== undefined && { partnerTwo: data.partnerTwo }),
      ...(data.eventDate !== undefined && {
        eventDate: data.eventDate ? new Date(data.eventDate + 'T00:00:00.000Z') : null,
      }),
      ...(data.eventTime !== undefined && { eventTime: data.eventTime }),
      ...(data.venueName !== undefined && { venueName: data.venueName }),
      ...(data.venueAddress !== undefined && { venueAddress: data.venueAddress }),
      ...(data.welcomeText !== undefined && { welcomeText: data.welcomeText }),
      ...(data.story !== undefined && { story: data.story }),
      ...(data.locale !== undefined && { locale: data.locale }),
      ...(data.template !== undefined && { template: data.template }),
      ...(data.isPublished !== undefined && {
        isPublished: data.isPublished,
        publishedAt: data.isPublished ? new Date() : null,
      }),
    },
  });

  return NextResponse.json({ wedding });
}
