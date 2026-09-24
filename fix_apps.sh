cat << 'INNER_EOF' > "src/app/admin/(dashboard)/apps/actions.ts"
'use server';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
export async function saveApplication(formData: FormData, id?: string) {
  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  if (!name || !slug) return { error: 'Name and slug are required' };

  const data = { 
    name, slug, 
    shortDescription: formData.get('shortDescription') as string, 
    fullDescription: formData.get('fullDescription') as string, 
    appStoreStatus: formData.get('appStoreStatus') as 'COMING_SOON' | 'AVAILABLE', 
    appStoreUrl: formData.get('appStoreUrl') as string || null, 
    appStoreId: formData.get('appStoreId') as string || null,
    platform: formData.get('platform') as string || 'iOS',
    version: formData.get('version') as string || null,
    price: formData.get('price') as string || null,
    privacyPolicyUrl: formData.get('privacyPolicyUrl') as string || null,
    termsOfUseUrl: formData.get('termsOfUseUrl') as string || null,
    supportUrl: formData.get('supportUrl') as string || null,
    isFeatured: formData.get('isFeatured') === 'true',
    seoTitle: formData.get('seoTitle') as string || null,
    seoDescription: formData.get('seoDescription') as string || null,
    status: formData.get('status') as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
    logoId: formData.get('logoId') as string || null,
    heroImageId: formData.get('heroImageId') as string || null,
  };
  
  if (id) { await prisma.application.update({ where: { id }, data }); } 
  else { await prisma.application.create({ data }); }
  
  revalidatePath('/admin/apps'); revalidatePath('/apps'); revalidatePath('/'); revalidatePath(\`/apps/\${slug}\`);
  redirect('/admin/apps');
}
export async function deleteApplication(id: string) {
  await prisma.application.delete({ where: { id } });
  revalidatePath('/admin/apps'); revalidatePath('/apps'); revalidatePath('/');
  redirect('/admin/apps');
}
INNER_EOF

cat << 'INNER_EOF' > "src/app/admin/(dashboard)/apps/AppForm.tsx"
'use client';
import { useActionState } from 'react';
import { saveApplication } from './actions';
import Link from 'next/link';
import MediaSelector from '@/components/admin/MediaSelector';

export default function AppForm({ initialData }: { initialData?: any }) {
  const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => { return await saveApplication(formData, initialData?.id); }, null);
  return (
    <form action={formAction} className="max-w-4xl space-y-8 pb-20">
      {state?.error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">{state.error}</div>}
      
      <div className="space-y-6">
        <h2 className="text-lg font-semibold border-b dark:border-zinc-800 pb-2">Basic Info</h2>
        <div className="grid grid-cols-2 gap-6">
          <div><label className="block text-sm font-medium mb-1">Name</label><input type="text" name="name" required defaultValue={initialData?.name} className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" /></div>
          <div><label className="block text-sm font-medium mb-1">Slug</label><input type="text" name="slug" required defaultValue={initialData?.slug} className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" /></div>
        </div>
        <div><label className="block text-sm font-medium mb-1">Short Description</label><input type="text" name="shortDescription" defaultValue={initialData?.shortDescription} className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" /></div>
        <div><label className="block text-sm font-medium mb-1">Full Description</label><textarea name="fullDescription" rows={5} defaultValue={initialData?.fullDescription} className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" /></div>
      </div>

      <div className="space-y-6">
        <h2 className="text-lg font-semibold border-b dark:border-zinc-800 pb-2">Media</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1">App Logo</label>
            <MediaSelector name="logoId" defaultValue={initialData?.logoId} defaultUrl={initialData?.logo?.url} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Hero Image</label>
            <MediaSelector name="heroImageId" defaultValue={initialData?.heroImageId} defaultUrl={initialData?.heroImage?.url} />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-lg font-semibold border-b dark:border-zinc-800 pb-2">App Store Details</h2>
        <div className="grid grid-cols-2 gap-6">
          <div><label className="block text-sm font-medium mb-1">App Store Status</label><select name="appStoreStatus" defaultValue={initialData?.appStoreStatus || 'COMING_SOON'} className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700"><option value="COMING_SOON">Coming Soon</option><option value="AVAILABLE">Available</option></select></div>
          <div><label className="block text-sm font-medium mb-1">Platform</label><input type="text" name="platform" defaultValue={initialData?.platform || 'iOS'} className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" /></div>
          <div><label className="block text-sm font-medium mb-1">App Store URL</label><input type="url" name="appStoreUrl" defaultValue={initialData?.appStoreUrl} className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" /></div>
          <div><label className="block text-sm font-medium mb-1">App Store ID</label><input type="text" name="appStoreId" defaultValue={initialData?.appStoreId} className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" /></div>
          <div><label className="block text-sm font-medium mb-1">Version</label><input type="text" name="version" defaultValue={initialData?.version} className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" /></div>
          <div><label className="block text-sm font-medium mb-1">Price</label><input type="text" name="price" defaultValue={initialData?.price || 'Free'} className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" /></div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-lg font-semibold border-b dark:border-zinc-800 pb-2">Links</h2>
        <div className="grid grid-cols-3 gap-6">
          <div><label className="block text-sm font-medium mb-1">Privacy Policy URL</label><input type="url" name="privacyPolicyUrl" defaultValue={initialData?.privacyPolicyUrl} className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" /></div>
          <div><label className="block text-sm font-medium mb-1">Terms of Use URL</label><input type="url" name="termsOfUseUrl" defaultValue={initialData?.termsOfUseUrl} className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" /></div>
          <div><label className="block text-sm font-medium mb-1">Support URL</label><input type="url" name="supportUrl" defaultValue={initialData?.supportUrl} className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" /></div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-lg font-semibold border-b dark:border-zinc-800 pb-2">SEO & Settings</h2>
        <div className="grid grid-cols-2 gap-6">
          <div><label className="block text-sm font-medium mb-1">SEO Title</label><input type="text" name="seoTitle" defaultValue={initialData?.seoTitle} className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" /></div>
          <div><label className="block text-sm font-medium mb-1">SEO Description</label><input type="text" name="seoDescription" defaultValue={initialData?.seoDescription} className="w-full p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700" /></div>
        </div>
        <div className="flex gap-6 items-center">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" name="isFeatured" value="true" defaultChecked={initialData?.isFeatured} className="rounded" />
            Featured Application
          </label>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Publication Status</label>
            <select name="status" defaultValue={initialData?.status || 'DRAFT'} className="p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700">
              <option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-4 border-t dark:border-zinc-800">
        <button type="submit" disabled={isPending} className="bg-black text-white dark:bg-white dark:text-black px-6 py-2 rounded-md font-medium disabled:opacity-50">{isPending ? 'Saving...' : 'Save Application'}</button>
        <Link href="/admin/apps" className="px-6 py-2 border rounded-md font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900">Cancel</Link>
      </div>
    </form>
  );
}
INNER_EOF

