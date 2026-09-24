import { prisma } from '@/lib/db';
import SubmitButton from '@/components/admin/SubmitButton';
import { revalidatePath } from 'next/cache';
export default async function SocialPage() {
  const links = await prisma.socialLink.findMany();
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Social Links</h1>
      <form action={async (formData) => {
        'use server';
        const platform = formData.get('platform') as string;
        const url = formData.get('url') as string;
        if(platform && url) await prisma.socialLink.create({ data: { platform, url, enabled: true } });
        revalidatePath('/admin/social');
      }} className="flex gap-4 items-end mb-8">
        <div className="flex-1"><label className="block text-sm font-medium mb-1">Platform (e.g. Twitter)</label><input type="text" name="platform" required className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" /></div>
        <div className="flex-1"><label className="block text-sm font-medium mb-1">URL</label><input type="url" name="url" required className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" /></div>
        <SubmitButton>Add</SubmitButton>
      </form>
      <div className="space-y-4">
        {links.map(link => (
          <div key={link.id} className="flex justify-between items-center p-4 border rounded-md bg-white dark:bg-zinc-950 dark:border-zinc-800">
            <div><p className="font-medium">{link.platform}</p><p className="text-sm text-zinc-500">{link.url}</p></div>
            <form action={async () => { 'use server'; await prisma.socialLink.delete({ where: { id: link.id } }); revalidatePath('/admin/social'); }}>
              <button type="submit" className="text-red-600 text-sm">Remove</button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
