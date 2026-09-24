import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import SubmitButton from '@/components/admin/SubmitButton';
import MediaSelector from '@/components/admin/MediaSelector';

export default async function SettingsPage() {
  const settings = await prisma.siteSettings.findFirst({
    include: { heroImage: true }
  });

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Site Settings</h1>
      <form action={async (formData) => {
        'use server';
        const siteName = formData.get('siteName') as string;
        const defaultSeoDesc = formData.get('defaultSeoDesc') as string;
        const heroImageId = formData.get('heroImageId') as string;

        const data = { 
          siteName: siteName || 'ElarioLabs', 
          defaultSeoDesc: defaultSeoDesc || null,
          heroImageId: heroImageId || null
        };

        const existing = await prisma.siteSettings.findFirst();
        if (existing) { 
          await prisma.siteSettings.update({ where: { id: existing.id }, data }); 
        } else { 
          await prisma.siteSettings.create({ data }); 
        }
        revalidatePath('/', 'layout'); 
        revalidatePath('/admin/settings');
      }} className="space-y-6">
        
        <div>
          <label className="block text-sm font-medium mb-1">Site Name</label>
          <input type="text" name="siteName" defaultValue={settings?.siteName || ''} className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Homepage Hero Image (Phone Mockup)</label>
          <p className="text-xs text-zinc-500 mb-2">Upload a portrait screenshot (like an app card) to display inside the iPhone mockup on the homepage.</p>
          <MediaSelector 
            name="heroImageId" 
            defaultValue={settings?.heroImageId || ''} 
            defaultUrl={settings?.heroImage?.url || ''} 
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Default SEO Description</label>
          <textarea name="defaultSeoDesc" rows={3} defaultValue={settings?.defaultSeoDesc || ''} className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" />
        </div>

        <SubmitButton>Save Settings</SubmitButton>
      </form>
    </div>
  );
}
