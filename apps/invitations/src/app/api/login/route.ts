import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createInvitationSession, invitationCookieName, publicBase, sameOrigin } from '@/lib/auth';

const schema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(200),
});

export async function POST(req: NextRequest) {
  const base = publicBase(req);

  if (!sameOrigin(req)) {
    return NextResponse.redirect(new URL('/login?error=invalid_request', base), 303);
  }

  const form = await req.formData();
  const parsed = schema.safeParse({
    email: String(form.get('email') ?? '').trim().toLowerCase(),
    password: String(form.get('password') ?? ''),
  });

  if (!parsed.success) {
    return NextResponse.redirect(new URL('/login?error=invalid_credentials', base), 303);
  }

  const account = await db.invitationAccount.findUnique({
    where: { email: parsed.data.email },
  });

  if (
    !account ||
    !account.active ||
    (account.accessExpiresAt && account.accessExpiresAt <= new Date())
  ) {
    return NextResponse.redirect(new URL('/login?error=invalid_credentials', base), 303);
  }

  const valid = await bcrypt.compare(parsed.data.password, account.passwordHash);
  if (!valid) {
    return NextResponse.redirect(new URL('/login?error=invalid_credentials', base), 303);
  }

  const session = await createInvitationSession(account.id);
  const response = NextResponse.redirect(new URL('/dashboard', base), 303);

  response.cookies.set({
    name: invitationCookieName(),
    value: session.token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: session.expiresAt,
  });

  return response;
}

