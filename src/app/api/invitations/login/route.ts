import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import {
  createInvitationSession,
  invitationCookieName,
} from '@/lib/invitations/auth';

const schema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(200),
});

function validOrigin(req: Request) {
  const origin = req.headers.get('origin');
  const forwardedHost = req.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const host = (forwardedHost || req.headers.get('host') || '').toLowerCase();

  if (!origin || !host) return false;

  try {
    const url = new URL(origin);
    return (
      (url.protocol === 'https:' || url.protocol === 'http:') &&
      url.host.toLowerCase() === host
    );
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  if (!validOrigin(req)) {
    return new Response('Forbidden', { status: 403 });
  }

  const formData = await req.formData();
  const parsed = schema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  const loginUrl = new URL('/login?error=1', req.url);

  if (!parsed.success) {
    return NextResponse.redirect(loginUrl, 303);
  }

  const account = await db.invitationAccount.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });

  if (
    !account ||
    !account.active ||
    (account.accessExpiresAt && account.accessExpiresAt <= new Date()) ||
    !(await bcrypt.compare(parsed.data.password, account.passwordHash))
  ) {
    return NextResponse.redirect(loginUrl, 303);
  }

  const { token, expiresAt } = await createInvitationSession(account.id);

  const response = NextResponse.redirect(new URL('/dashboard', req.url), 303);

  response.cookies.set(invitationCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });

  return response;
}
