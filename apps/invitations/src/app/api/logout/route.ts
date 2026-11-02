import { NextRequest, NextResponse } from 'next/server';
import { deleteInvitationSession, invitationCookieName } from '@/lib/auth';

function sameOrigin(req: NextRequest) {
  const origin = req.headers.get('origin');
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) {
    return NextResponse.redirect(new URL('/dashboard', req.url), 303);
  }

  await deleteInvitationSession();
  const response = NextResponse.redirect(new URL('/login', req.url), 303);

  response.cookies.set({
    name: invitationCookieName(),
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  });

  return response;
}
