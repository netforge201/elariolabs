import { NextResponse } from 'next/server';
import { z } from 'zod';
import { currentAdmin, sameOrigin, publicBase } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { db } from '@/lib/db';

const schema = z.object({
  'seo.title': z.string().trim().min(5).max(70),
  'seo.description': z.string().trim().min(20).max(200),
});

export async function POST(req: Request) {
  if (!await sameOrigin(req)) {
    return new Response('Forbidden', { status: 403 });
  }

  const admin = await currentAdmin();

  if (!admin) {
    return NextResponse.redirect(
      new URL('/admin/login', publicBase(req)), 303
    );
  }

  if (!await requirePermission('settings.manage')) {
    return new Response('Forbidden', { status: 403 });
  }

  const form = await req.formData();

  const parsed = schema.safeParse({
    'seo.title': form.get('seo.title'),
    'seo.description': form.get('seo.description'),
  });

  if (!parsed.success) {
    return NextResponse.redirect(
      new URL('/admin/seo-metadata?error=invalid', publicBase(req)), 303
    );
  }

  for (const [key, value] of Object.entries(parsed.data)) {
    await db.siteSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }

  return NextResponse.redirect(
    new URL('/admin/seo-metadata?saved=1', publicBase(req)), 303
  );
}
