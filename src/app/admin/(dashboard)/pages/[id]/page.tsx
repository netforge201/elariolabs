import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import PageForm from '../PageForm';
import { deletePage } from '../actions';
export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const page = await prisma.staticPage.findUnique({ where: { id: resolvedParams.id } });
  if (!page) notFound();
  return (
    <div>
      <div className="flex justify-between items-center mb-6 max-w-4xl">
        <h1 className="text-2xl font-semibold tracking-tight">Edit Page</h1>
        <form action={async () => { 'use server'; await deletePage(page.id); }}><button type="submit" className="text-red-600 hover:underline text-sm font-medium">Delete</button></form>
      </div>
      <PageForm initialData={page} />
    </div>
  );
}
