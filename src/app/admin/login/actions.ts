'use server';

import { prisma } from '@/lib/db';
import { verifyPassword } from '@/lib/auth';
import { createSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import rateLimit from '@/lib/rate-limit';

export async function loginAdmin(formData: FormData) {
  // Добавили await перед headers()
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for') || '127.0.0.1';

  // Проверяем лимит: максимум 5 попыток в минуту (60000 мс)
  const isAllowed = rateLimit(ip, 5, 60000);
  if (!isAllowed) {
    return { error: 'Too many login attempts. Please try again later.' };
  }

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) { return { error: 'Invalid email or password.' }; }

  await new Promise(r => setTimeout(r, 500));

  const user = await prisma.adminUser.findUnique({ where: { email }, });
  if (!user) { return { error: 'Invalid email or password.' }; }

  const isValid = await verifyPassword(user.passwordHash, password);
  if (!isValid) { return { error: 'Invalid email or password.' }; }

  await createSession(user.id);
  redirect('/admin');
}