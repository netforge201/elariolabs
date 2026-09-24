'use server';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
export async function saveArticle(formData: FormData) {
  const id = formData.get("id") as string;
  const title = formData.get('title') as string;
  const slug = formData.get('slug') as string;
  const excerpt = formData.get('excerpt') as string;
  const content = formData.get('content') as string;
  const author = formData.get('author') as string;
  const status = formData.get('status') as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  const coverImageId = formData.get('coverImageId') as string || null;
  const isFeatured = formData.get('isFeatured') === 'true';
  const seoTitle = formData.get('seoTitle') as string || null;
  const seoDescription = formData.get('seoDescription') as string || null;
  
  if (!title || !slug || !content) throw new Error( 'Title, slug, and content are required' );
  
  const data = { title, slug, excerpt, content, author, status, coverImageId, isFeatured, seoTitle, seoDescription, publishedAt: status === 'PUBLISHED' ? new Date() : null };
  if (id) {
    const existing = await prisma.blogArticle.findUnique({ where: { id } });
    if (existing?.publishedAt && status === 'PUBLISHED') { data.publishedAt = existing.publishedAt; }
    await prisma.blogArticle.update({ where: { id }, data });
  } else {
    await prisma.blogArticle.create({ data });
  }
  revalidatePath('/admin/blog'); revalidatePath('/blog'); revalidatePath('/');
  redirect('/admin/blog');
}
export async function deleteArticle(id: string) {
  await prisma.blogArticle.delete({ where: { id } });
  revalidatePath('/admin/blog'); revalidatePath('/blog'); revalidatePath('/');
  redirect('/admin/blog');
}
