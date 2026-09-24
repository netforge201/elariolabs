'use server';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
export async function savePage(formData: FormData) {
  const id = formData.get("id") as string;
  const title = formData.get('title') as string;
  const slug = formData.get('slug') as string;
  const content = formData.get('content') as string;
  const status = formData.get('status') as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  if (!title || !slug || !content) throw new Error( 'Title, slug, and content are required' );
  const data = { title, slug, content, status };
  if (id) { await prisma.staticPage.update({ where: { id }, data }); } else { await prisma.staticPage.create({ data }); }
  revalidatePath('/admin/pages'); revalidatePath(`/${slug}`);
  redirect('/admin/pages');
}
export async function deletePage(id: string) {
  await prisma.staticPage.delete({ where: { id } });
  revalidatePath('/admin/pages');
  redirect('/admin/pages');
}
