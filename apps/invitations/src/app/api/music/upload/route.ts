import { NextRequest, NextResponse } from 'next/server';
import { currentInvitationAccount, sameOrigin } from '@/lib/auth';
import { db } from '@/lib/db';
import { cleanFilename, pruneMusicFiles, savedUploadId, sniffAudio } from '@/lib/music-files';
import { MAX_AUDIO_BYTES } from '@/app/components/invitation/catalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Stores one audio file for the signed-in couple and returns its reference.
 * The invitation only starts using it once the editor saves `musicUpload`.
 */
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin', code: 'origin' }, { status: 403 });
  }
  const account = await currentInvitationAccount();
  if (!account) {
    return NextResponse.json({ error: 'Unauthorized', code: 'auth' }, { status: 401 });
  }

  const declared = Number(request.headers.get('content-length') || 0);
  if (declared > MAX_AUDIO_BYTES + 64 * 1024) {
    return NextResponse.json({ error: 'File is too large', code: 'size' }, { status: 413 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Expected a file upload', code: 'invalid' }, { status: 400 });
  }
  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'No file received', code: 'invalid' }, { status: 400 });
  }
  if (file.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: 'File is too large', code: 'size' }, { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = sniffAudio(bytes);
  if (!mime) {
    return NextResponse.json({ error: 'Unsupported audio format', code: 'type' }, { status: 415 });
  }

  const saved = await savedUploadId(account.id);
  const created = await db.invitationMusicFile.create({
    data: { accountId: account.id, filename: cleanFilename(file.name), mimeType: mime, size: bytes.length, data: Buffer.from(bytes) },
    select: { id: true, filename: true, mimeType: true, size: true },
  });
  // Earlier uploads that were never saved are no longer reachable: drop them.
  await pruneMusicFiles(account.id, [created.id, saved]);

  return NextResponse.json({
    upload: { id: created.id, name: created.filename, mime: created.mimeType, size: created.size },
  }, { status: 201 });
}
