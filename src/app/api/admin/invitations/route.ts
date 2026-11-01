import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db';
import { currentAdmin, sameOrigin, publicBase } from '@/lib/auth';

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(200),
  accessExpiresAt: z.string().optional(),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  active: z.enum(['true', 'false']),
  password: z.string().max(200).optional(),
  accessExpiresAt: z.string().optional(),
});

function expiryDate(value?: string) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;

  const date = new Date(`${value}T23:59:59.999Z`);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

function redirectToAdmin(req: Request, query: string) {
  return NextResponse.redirect(
    new URL(`/admin/invitations?${query}`, publicBase(req)),
    303,
  );
}

export async function POST(req: Request) {
  if (!(await sameOrigin(req))) {
    return new Response('Forbidden', { status: 403 });
  }

  const actor = await currentAdmin();

  if (!actor) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (actor.role.name !== 'Super Admin' || actor.mustChangePassword) {
    return new Response('Forbidden', { status: 403 });
  }

  const form = await req.formData();
  const action = String(form.get('action') || '');

  if (action === 'create') {
    const parsed = createSchema.safeParse({
      name: form.get('name'),
      email: form.get('email'),
      password: form.get('password'),
      accessExpiresAt: String(form.get('accessExpiresAt') || ''),
    });

    if (!parsed.success) return redirectToAdmin(req, 'error=invalid');

    const expiresAt = expiryDate(parsed.data.accessExpiresAt);
    if (expiresAt === undefined) return redirectToAdmin(req, 'error=invalid');

    try {
      await db.invitationAccount.create({
        data: {
          name: parsed.data.name,
          email: parsed.data.email.toLowerCase(),
          passwordHash: await bcrypt.hash(parsed.data.password, 12),
          accessExpiresAt: expiresAt,
        },
      });

      return redirectToAdmin(req, 'created=1');
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        return redirectToAdmin(req, 'error=duplicate');
      }
      throw error;
    }
  }

  if (action === 'update') {
    const parsed = updateSchema.safeParse({
      id: form.get('id'),
      active: form.get('active'),
      password: String(form.get('password') || ''),
      accessExpiresAt: String(form.get('accessExpiresAt') || ''),
    });

    if (!parsed.success) return redirectToAdmin(req, 'error=invalid');

    const expiresAt = expiryDate(parsed.data.accessExpiresAt);
    if (expiresAt === undefined) return redirectToAdmin(req, 'error=invalid');

    const account = await db.invitationAccount.findUnique({
      where: { id: parsed.data.id },
    });

    if (!account) return redirectToAdmin(req, 'error=missing');

    if (parsed.data.password && parsed.data.password.length < 12) {
      return redirectToAdmin(req, 'error=invalid');
    }

    const data: {
      active: boolean;
      accessExpiresAt: Date | null;
      passwordHash?: string;
    } = {
      active: parsed.data.active === 'true',
      accessExpiresAt: expiresAt,
    };

    if (parsed.data.password) {
      data.passwordHash = await bcrypt.hash(parsed.data.password, 12);
    }

    await db.$transaction(async (tx) => {
      await tx.invitationAccount.update({
        where: { id: account.id },
        data,
      });

      if (!data.active || data.passwordHash) {
        await tx.invitationSession.deleteMany({
          where: { accountId: account.id },
        });
      }
    });

    return redirectToAdmin(req, 'updated=1');
  }

  return redirectToAdmin(req, 'error=invalid');
}
