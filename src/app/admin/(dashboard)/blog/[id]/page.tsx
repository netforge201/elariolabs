import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import BlogForm from '../BlogForm';
import { deleteArticle } from '../actions';
export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const article = await prisma.blogArticle.findUnique({ where: { id: resolvedParams.id } });
  if (!article) notFound();
  return (
    <div>
      <div className="flex justify-between items-center mb-6 max-w-4xl">
        <h1 className="text-2xl font-semibold tracking-tight">Edit Article</h1>
        <form action={async () => { 'use server'; await deleteArticle(article.id); }}><button type="submit" className="text-red-600 hover:underline text-sm font-medium">Delete</button></form>
      </div>
      <BlogForm initialData={article} />
    </div>
  );
}
