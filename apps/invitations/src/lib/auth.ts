import { cookies } from 'next/headers';
import { createHash, randomBytes } from 'node:crypto';
import { db } from '@/lib/db';

const COOKIE_NAME = 'invitation_session';
const SESSION_DURATION = 1000 * 60 * 60 * 24 * 30;

const hash = (value: string) =>
  createHash('sha256').update(value).digest('hex');

export function newInvitationSessionToken() {
  return randomBytes(32).toString('base64url');
}

export async function createInvitationSession(accountId: string) {
  const token = newInvitationSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  await db.invitationSession.create({
    data: {
      accountId,
      tokenHash: hash(token),
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function currentInvitationAccount() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;

  if (!token) return null;

  const session = await db.invitationSession.findUnique({
    where: { tokenHash: hash(token) },
    include: { account: true },
  });

  if (!session) return null;

  if (
    session.expiresAt <= new Date() ||
    !session.account.active ||
    (session.account.accessExpiresAt !== null &&
      session.account.accessExpiresAt <= new Date())
  ) {
    await db.invitationSession.deleteMany({
      where: { id: session.id },
    });

    return null;
  }

  return session.account;
}

export async function deleteInvitationSession() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;

  if (token) {
    await db.invitationSession.deleteMany({
      where: { tokenHash: hash(token) },
    });
  }
}

export function invitationCookieName() {
  return COOKIE_NAME;
}

export function publicBase(req: Request): string {
  const origin = req.headers.get('origin');
  if (origin) {
    try {
      const u = new URL(origin);
      if (['http:', 'https:'].includes(u.protocol)) {
        return u.origin;
      }
    } catch {}
  }

  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    try {
      const u = new URL(appUrl);
      if (['http:', 'https:'].includes(u.protocol)) {
        return u.origin;
      }
    } catch {}
  }

  const proto = req.headers.get('x-forwarded-proto') || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const forwardedHost = req.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const rawHost = forwardedHost || req.headers.get('host') || 'invitation.elariolabs.com';
  const isLocal = rawHost.startsWith('localhost') || rawHost.startsWith('127.0.0.1');
  const host = isLocal ? rawHost : rawHost.replace(/:\d+$/, '');

  return `${proto}://${host}`;
}

export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return false;

  try {
    const originUrl = new URL(origin);
    if (!['http:', 'https:'].includes(originUrl.protocol)) return false;

    const originHostname = originUrl.hostname.toLowerCase();
    const forwardedHost = req.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
    const rawHost = (forwardedHost || req.headers.get('host') || '').toLowerCase();
    const requestHostname = rawHost.replace(/:\d+$/, '');

    if (requestHostname && originHostname === requestHostname) {
      return true;
    }

    const baseHostname = new URL(publicBase(req)).hostname.toLowerCase();
    if (originHostname === baseHostname) {
      return true;
    }

    const allowedHostnames = new Set([
      'invitation.elariolabs.com',
      'invitations.elariolabs.com',
      'elariolabs.com',
      'www.elariolabs.com',
      'localhost',
      '127.0.0.1',
    ]);

    return allowedHostnames.has(originHostname);
  } catch {
    return false;
  }
}

