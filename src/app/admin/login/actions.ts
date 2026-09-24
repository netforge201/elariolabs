'use server';
import { prisma } from '@/lib/db';
import { verifyPassword } from '@/lib/auth';
import { createSession } from '@/lib/session';
import { redirect } from 'next/navigation';
export async function loginAdmin(formData: FormData) {
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
