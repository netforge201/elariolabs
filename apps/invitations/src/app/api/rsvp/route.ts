import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const rsvpSchema = z.object({
  weddingSlug: z.string().min(1),
  guestName: z.string().trim().min(1).max(100),
  guestSlug: z.string().optional(),
  // The invitation no longer offers a decline option; every reply is a confirmation.
  attending: z.boolean().default(true),
  guestsCount: z.number().int().min(1).max(10).default(1),
  message: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = rsvpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 });
  }

  const { weddingSlug, guestName, guestSlug, attending, guestsCount, message } = parsed.data;

  const wedding = await db.invitationWedding.findUnique({
    where: { slug: weddingSlug },
    select: { id: true, theme: true },
  });

  if (!wedding) {
    return NextResponse.json({ error: 'Wedding not found' }, { status: 404 });
  }

  const existingTheme = wedding.theme && typeof wedding.theme === 'object' && !Array.isArray(wedding.theme)
    ? wedding.theme as Record<string, unknown>
    : {};

  const existingRsvps = Array.isArray(existingTheme.rsvps)
    ? (existingTheme.rsvps as Record<string, unknown>[])
    : [];

  const key = guestSlug || guestName.toLowerCase();
  const nextRsvps = existingRsvps.filter(r => (r.guestSlug || String(r.guestName).toLowerCase()) !== key);

  nextRsvps.push({
    guestName,
    guestSlug: guestSlug || null,
    attending,
    guestsCount,
    message: message || '',
    updatedAt: new Date().toISOString(),
  });

  await db.invitationWedding.update({
    where: { id: wedding.id },
    data: {
      theme: {
        ...existingTheme,
        rsvps: nextRsvps,
      } as never,
    },
  });

  return NextResponse.json({ success: true, count: nextRsvps.length });
}

