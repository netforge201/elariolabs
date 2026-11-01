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
