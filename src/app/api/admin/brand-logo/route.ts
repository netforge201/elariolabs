import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { currentAdmin, publicBase, sameOrigin } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { db } from '@/lib/db';
import { mediaStorage } from '@/lib/storage';

export const runtime = 'nodejs';

function settingsRedirect(req: Request, query: string) {
  return NextResponse.redirect(new URL(`/admin/studio-settings${query}`, publicBase(req)), 303);
}

export async function POST(req: Request) {
  if (!await sameOrigin(req)) return new Response('Forbidden', { status: 403 });

  let stored: { key: string; url: string; deleteUrl?: string } | undefined;
  try {
    const user = await currentAdmin();
    if (!user) return NextResponse.redirect(new URL('/admin/login', publicBase(req)), 303);
    if (!await requirePermission('settings.manage')) return new Response('Forbidden', { status: 403 });

    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File) || !file.size || file.size > 8 * 1024 * 1024) {
      return settingsRedirect(req, '?error=logo');
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
      return settingsRedirect(req, '?error=logo');
    }

    stored = await mediaStorage().put(bytes, mime, ext);
    await db.$transaction(async tx => {
      await tx.mediaAsset.create({ data: {
        storageKey: stored!.key,
        deleteUrl: stored!.deleteUrl,
        originalFilename: file.name.slice(0, 240),
        storedName: `${randomUUID()}.${ext}`,
        mimeType: mime,
        size: file.size,
        altText: 'ElarioLabs logo',
        uploadedBy: user.id,
      } });
      await tx.siteSetting.upsert({
        where: { key: 'brand.logoUrl' },
        create: { key: 'brand.logoUrl', value: stored!.url },
        update: { value: stored!.url },
      });
    });
    await db.auditLog.create({ data: {
      actorId: user.id,
      action: 'upload',
      entity: 'brand_logo',
      entityId: stored.key,
      summary: { mime, size: file.size },
    } }).catch(error => console.error('Could not record brand logo upload audit event.', error));

    return settingsRedirect(req, '?saved=logo');
  } catch (error) {
    if (stored) {
      try { await mediaStorage().remove(stored.key, stored.deleteUrl); }
      catch (cleanupError) { console.error('Could not clean up an incomplete logo upload.', cleanupError); }
    }
    console.error('Brand logo upload failed.', error);
    return settingsRedirect(req, '?error=upload');
  }
}
