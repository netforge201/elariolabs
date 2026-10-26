import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { currentAdmin, sameOrigin, hash } from '@/lib/auth';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  if (!await sameOrigin(req)) return new Response('Forbidden', { status: 403 });

  const user = await currentAdmin();
  if (!user) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 });

  let body: { currentPassword?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  if (typeof body.currentPassword !== 'string' ||
      typeof body.password !== 'string' ||
      body.password.length < 14 ||
      body.password.length > 200) {
    return NextResponse.json({ error: 'Password must be 14–200 characters.' }, { status: 400 });
  }

  const valid = await bcrypt.compare(body.currentPassword, user.passwordHash);
  if (!valid) return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });

  const cookieStore = await cookies();
  const token = cookieStore.get('elario_session')?.value;
  const tokenHash = token ? hash(token) : null;

  await db.$transaction([
    db.adminUser.update({
      where: { id: user.id },
      data: {
        passwordHash: await bcrypt.hash(body.password, 12),
        mustChangePassword: false,
      },
    }),
    db.adminSession.deleteMany({
      where: { userId: user.id, ...(tokenHash ? { tokenHash: { not: tokenHash } } : {}) },
    }),
  ]);

  return NextResponse.json({ success: true });
}
