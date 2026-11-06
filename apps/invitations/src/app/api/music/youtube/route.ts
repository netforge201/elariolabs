import { NextRequest, NextResponse } from 'next/server';
import { currentInvitationAccount } from '@/lib/auth';
import { parseYouTubeId } from '@/app/components/invitation/catalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Validates a YouTube link for the editor and looks up the video's title via
 * YouTube's public oEmbed endpoint (no API key). oEmbed also tells us when a
 * video is private, removed, or does not allow embedding.
 * Signed-in couples only, so this cannot be used as an open proxy.
 */
export async function GET(request: NextRequest) {
  const account = await currentInvitationAccount();
  if (!account) return NextResponse.json({ error: 'Unauthorized', code: 'auth' }, { status: 401 });

  const videoId = parseYouTubeId(request.nextUrl.searchParams.get('url') ?? '');
  if (!videoId) return NextResponse.json({ error: 'Not a YouTube video link', code: 'invalid' }, { status: 400 });

  const target = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`;
  let response: Response;
  try {
    response = await fetch(target, { signal: AbortSignal.timeout(6000), cache: 'no-store' });
  } catch {
    // YouTube could not be reached; the link itself is valid, so let the
    // couple keep it (the player reports any problem when it loads).
    return NextResponse.json({ video: { videoId, title: null, author: null }, verified: false });
  }

  if (response.status === 401 || response.status === 403) {
    return NextResponse.json({ error: 'The owner of this video does not allow it to be embedded', code: 'embed' }, { status: 422 });
  }
  if (response.status === 400 || response.status === 404) {
    return NextResponse.json({ error: 'Video not found or private', code: 'missing' }, { status: 404 });
  }
  if (!response.ok) {
    return NextResponse.json({ video: { videoId, title: null, author: null }, verified: false });
  }

  const data = await response.json().catch(() => ({})) as { title?: unknown; author_name?: unknown };
  const text = (value: unknown, max: number) => (typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null);
  return NextResponse.json({
    video: { videoId, title: text(data.title, 300), author: text(data.author_name, 200) },
    verified: true,
  });
}
