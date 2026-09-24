import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import AppForm from '../AppForm';
import { deleteApplication } from '../actions';
export default async function EditAppPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const app = await prisma.application.findUnique({ where: { id: resolvedParams.id } });
  if (!app) notFound();
  return (
    <div>
      <div className="flex justify-between items-center mb-6 max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight">Edit Application</h1>
        <form action={async () => { 'use server'; await deleteApplication(app.id); }}><button type="submit" className="text-red-600 hover:underline text-sm font-medium">Delete</button></form>
      </div>
      <AppForm initialData={app} />
    </div>
  );
}
