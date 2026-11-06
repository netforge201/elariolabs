import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { currentInvitationAccount, sameOrigin } from '@/lib/auth';
import { db } from '@/lib/db';
import { MUSIC_CHOICES, MUSIC_UPLOAD, readMusicSettings } from '@/app/components/invitation/catalog';
import { pruneMusicFiles } from '@/lib/music-files';

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
  template: z.string().max(50).optional(),
  coverImage: z.string().max(5000000).nullable().optional(),
  music: z.string().refine(value => MUSIC_CHOICES.includes(value), 'Unknown music track').nullable().optional(),
  // Only the id is trusted from the client; name/type/size come from the stored file.
  musicUpload: z.object({ id: z.string().uuid() }).nullable().optional(),
  musicVolume: z.number().min(0).max(1).optional(),
  isPublished: z.boolean().optional(),
});

const updateSchema = weddingSchema.partial().strict();

type MusicInput = Pick<z.infer<typeof weddingSchema>, 'music' | 'musicUpload' | 'musicVolume'>;
type Theme = Record<string, unknown>;

function themeOf(value: unknown): Theme {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Theme : {};
}

/** Theme fields returned to the editor alongside the wedding row. */
function themeFields(theme: Theme) {
  return {
    coverImage: typeof theme.coverImage === 'string' ? theme.coverImage : null,
    ...readMusicSettings(theme),
  };
}

/**
 * Applies the music part of a request to a theme. Returns an error message when
 * the request refers to an upload the account does not own, or selects a custom
 * source without providing it.
 */
type MusicError = { error: string; code: 'upload_missing' | 'invalid' };

async function applyMusic(theme: Theme, data: MusicInput, accountId: string): Promise<MusicError | null> {
  if (data.music !== undefined) theme.music = data.music;
  if (data.musicVolume !== undefined) theme.musicVolume = data.musicVolume;
  // Left over from the removed YouTube option.
  delete theme.musicYoutube;
  if (data.musicUpload !== undefined) {
    if (!data.musicUpload) {
      theme.musicUpload = null;
    } else {
      const file = await db.invitationMusicFile.findFirst({
        where: { id: data.musicUpload.id, accountId },
        select: { id: true, filename: true, mimeType: true, size: true },
      });
      if (!file) return { error: 'Uploaded music not found — please upload the file again.', code: 'upload_missing' };
      theme.musicUpload = { id: file.id, name: file.filename, mime: file.mimeType, size: file.size };
    }
  }
  if (theme.music === MUSIC_UPLOAD && !theme.musicUpload) return { error: 'Upload an audio file before selecting it.', code: 'invalid' };
  return null;
}

const MUSIC_KEYS = ['music', 'musicUpload', 'musicVolume'] as const;



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

  if (!wedding) {
    return NextResponse.json({ wedding: null });
  }

  return NextResponse.json({
    wedding: { ...wedding, ...themeFields(themeOf(wedding.theme)) },
  });
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
  const theme: Theme = { ...(data.coverImage && { coverImage: data.coverImage }) };
  const musicError = await applyMusic(theme, data, account.id);
  if (musicError) return NextResponse.json(musicError, { status: 400 });
  if (theme.music === null) delete theme.music;
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
      template: data.template ?? 'classic',
      theme: Object.keys(theme).length ? theme as never : undefined,
    },
  });

  if (theme.musicUpload) await pruneMusicFiles(account.id, [(theme.musicUpload as { id: string }).id]);

  return NextResponse.json({
    wedding: { ...wedding, ...themeFields(theme) },
  }, { status: 201 });
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

  const existingTheme = themeOf(existing.theme);
  const previousUpload = readMusicSettings(existingTheme).musicUpload?.id ?? null;

  const themeChanged = data.coverImage !== undefined || MUSIC_KEYS.some(key => data[key] !== undefined);
  const nextTheme: Theme = {
    ...existingTheme,
    ...(data.coverImage !== undefined && { coverImage: data.coverImage }),
  };
  const musicError = await applyMusic(nextTheme, data, account.id);
  if (musicError) {
    // Hand back what is actually saved, so the editor can recover by itself.
    return NextResponse.json({ ...musicError, current: readMusicSettings(existingTheme) }, { status: 400 });
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
      ...(themeChanged && { theme: nextTheme as never }),
      ...(data.isPublished !== undefined && {
        isPublished: data.isPublished,
        publishedAt: data.isPublished ? new Date() : null,
      }),
    },
  });

  // A replaced or removed upload is no longer referenced by anything.
  const nextUpload = readMusicSettings(nextTheme).musicUpload?.id ?? null;
  if (data.musicUpload !== undefined && nextUpload !== previousUpload) {
    await pruneMusicFiles(account.id, [nextUpload]);
  }

  return NextResponse.json({
    wedding: { ...wedding, ...themeFields(nextTheme) },
  });
}
