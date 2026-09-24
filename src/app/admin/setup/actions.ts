'use server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { createSession } from '@/lib/session';
import { redirect } from 'next/navigation';
export async function initializeAdmin(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  if (!email || !password || password.length < 8) { return { error: 'Invalid email or password (min 8 characters).' }; }
  const count = await prisma.adminUser.count();
  if (count > 0) { return { error: 'Administrator already exists.' }; }
  const passwordHash = await hashPassword(password);
  const user = await prisma.adminUser.create({ data: { email, passwordHash, }, });
  await createSession(user.id);
  redirect('/admin');
}
