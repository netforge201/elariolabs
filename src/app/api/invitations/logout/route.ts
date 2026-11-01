import { NextResponse } from 'next/server';
import {
  deleteInvitationSession,
  invitationCookieName,
} from '@/lib/invitations/auth';

export async function POST(req: Request) {
  const origin = req.headers.get('origin');
  const forwardedHost = req.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const host = (forwardedHost || req.headers.get('host') || '').toLowerCase();

  if (!origin || !host) {
    return new Response('Forbidden', { status: 403 });
  }

  try {
    const url = new URL(origin);
    if (
      (url.protocol !== 'https:' && url.protocol !== 'http:') ||
      url.host.toLowerCase() !== host
    ) {
      return new Response('Forbidden', { status: 403 });
    }
  } catch {
    return new Response('Forbidden', { status: 403 });
  }

  await deleteInvitationSession();

  const response = NextResponse.redirect(new URL('/login', req.url), 303);

  response.cookies.set(invitationCookieName(), '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  });

  return response;
}
