'use server';
import { deleteSession } from '@/lib/session';
import { redirect } from 'next/navigation';
export async function logoutAdmin() {
  await deleteSession();
  redirect('/admin/login');
}
