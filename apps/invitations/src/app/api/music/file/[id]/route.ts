import { NextRequest, NextResponse } from 'next/server';
import { currentInvitationAccount } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Params = { params: Promise<{ id: string }> };

/**
 * Streams an uploaded music file. Guests may load it once the invitation is
 * published; the owner can always load it (editor preview). Byte-range requests
 * are supported because Safari/iOS refuse to play media without them.
 */
async function load(request: NextRequest, { params }: Params, withBody: boolean) {
  const { id } = await params;
  if (!UUID.test(id)) return new NextResponse(null, { status: 404 });

  const file = await db.invitationMusicFile.findUnique({
    where: { id },
    select: {
      id: true, accountId: true, mimeType: true, size: true,
      account: { select: { active: true, accessExpiresAt: true, wedding: { select: { isPublished: true } } } },
    },
  });
  if (!file) return new NextResponse(null, { status: 404 });

  const { account } = file;
  const publiclyVisible = account.active
    && (!account.accessExpiresAt || account.accessExpiresAt > new Date())
    && account.wedding?.isPublished === true;
  if (!publiclyVisible) {
    const viewer = await currentInvitationAccount();
    if (viewer?.id !== file.accountId) return new NextResponse(null, { status: 404 });
  }

  let start = 0;
  let end = file.size - 1;
  let partial = false;
  const range = request.headers.get('range');
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (!match || (match[1] === '' && match[2] === '')) {
      return new NextResponse(null, { status: 416, headers: { 'Content-Range': `bytes */${file.size}` } });
    }
    if (match[1] === '') {
      // suffix range: the last N bytes
      start = Math.max(0, file.size - Number(match[2]));
    } else {
      start = Number(match[1]);
      if (match[2] !== '') end = Math.min(end, Number(match[2]));
    }
    if (start > end || start >= file.size) {
      return new NextResponse(null, { status: 416, headers: { 'Content-Range': `bytes */${file.size}` } });
    }
    partial = true;
  }
  const length = end - start + 1;

  const headers = new Headers({
    'Content-Type': file.mimeType,
    'Content-Length': String(length),
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, max-age=86400',
    'Content-Disposition': 'inline',
    'X-Content-Type-Options': 'nosniff',
    ETag: `"${file.id}"`,
  });
  if (partial) headers.set('Content-Range', `bytes ${start}-${end}/${file.size}`);
  if (!withBody) return new NextResponse(null, { status: partial ? 206 : 200, headers });

  // Only the requested slice leaves the database.
  const rows = await db.$queryRaw<{ chunk: Uint8Array }[]>`
    SELECT substring(data FROM ${start + 1}::int FOR ${length}::int) AS chunk
    FROM invitation_music_files WHERE id = ${id}::uuid`;
  const chunk = rows[0]?.chunk;
  if (!chunk) return new NextResponse(null, { status: 404 });

  return new NextResponse(Buffer.from(chunk), { status: partial ? 206 : 200, headers });
}

export function GET(request: NextRequest, context: Params) {
  return load(request, context, true);
}

export function HEAD(request: NextRequest, context: Params) {
  return load(request, context, false);
}
