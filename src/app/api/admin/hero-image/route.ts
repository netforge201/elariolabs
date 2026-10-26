import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { currentAdmin, publicBase, sameOrigin } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { db } from '@/lib/db';
import { mediaStorage } from '@/lib/storage';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  if (!await sameOrigin(req)) return new Response('Forbidden', { status: 403 });

  const user = await currentAdmin();
  if (!user) return NextResponse.redirect(new URL('/admin/login', publicBase(req)), 303);
  if (!await requirePermission('settings.manage')) return new Response('Forbidden', { status: 403 });

  let stored: { key: string; url: string; deleteUrl?: string } | undefined;

  try {
    const form = await req.formData();
    const file = form.get('file');

    if (!(file instanceof File) || !file.size || file.size > 8 * 1024 * 1024) {
      return NextResponse.redirect(new URL('/admin/studio-settings?error=hero', publicBase(req)), 303);
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    let mime: string;
    let ext: string;

    if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
      mime = 'image/png'; ext = 'png';
    } else if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) {
      mime = 'image/jpeg'; ext = 'jpg';
    } else if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') {
      mime = 'image/webp'; ext = 'webp';
    } else if (bytes.toString('ascii', 0, 4) === 'GIF8') {
      mime = 'image/gif'; ext = 'gif';
    } else {
      return NextResponse.redirect(new URL('/admin/studio-settings?error=hero', publicBase(req)), 303);
    }

    stored = await mediaStorage().put(bytes, mime, ext);

    await db.$transaction(async tx => {
      await tx.mediaAsset.create({
        data: {
          storageKey: stored!.key,
          deleteUrl: stored!.deleteUrl,
          originalFilename: file.name.slice(0, 240),
          storedName: `${randomUUID()}.${ext}`,
          mimeType: mime,
          size: file.size,
          altText: 'ElarioLabs homepage hero image',
          uploadedBy: user.id,
        },
      });

      await tx.siteSetting.upsert({
        where: { key: 'home.heroImageUrl' },
        create: { key: 'home.heroImageUrl', value: stored!.url },
        update: { value: stored!.url },
      });
    });

    return NextResponse.redirect(new URL('/admin/studio-settings?saved=hero', publicBase(req)), 303);
  } catch (error) {
    if (stored) {
      try { await mediaStorage().remove(stored.key, stored.deleteUrl); } catch {}
    }
    console.error('Homepage hero image upload failed.', error);
    return NextResponse.redirect(new URL('/admin/studio-settings?error=hero-upload', publicBase(req)), 303);
  }
}
