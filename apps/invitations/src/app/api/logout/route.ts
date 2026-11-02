import { NextRequest, NextResponse } from 'next/server';
import { deleteInvitationSession, invitationCookieName, publicBase, sameOrigin } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const base = publicBase(req);

  if (!sameOrigin(req)) {
    return NextResponse.redirect(new URL('/dashboard', base), 303);
  }

  await deleteInvitationSession();
  const response = NextResponse.redirect(new URL('/login', base), 303);

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
