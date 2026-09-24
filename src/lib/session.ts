import { cookies } from 'next/headers';
import { prisma } from './db';
import { randomBytes } from 'crypto';
export async function createSession(userId: string) {
  const sessionId = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await prisma.session.create({ data: { id: sessionId, userId, expiresAt } });
  const cookieStore = await cookies();
  cookieStore.set('elariolabs_session', session.id, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', expires: expiresAt, path: '/' });
  return session;
}
export async function getSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('elariolabs_session')?.value;
  if (!sessionId) return null;
  const session = await prisma.session.findUnique({ where: { id: sessionId }, include: { user: true } });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) { await prisma.session.delete({ where: { id: session.id } }); return null; }
  return session;
}
export async function deleteSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('elariolabs_session')?.value;
  if (sessionId) { await prisma.session.deleteMany({ where: { id: sessionId } }); }
  cookieStore.delete('elariolabs_session');
}
