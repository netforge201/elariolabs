'use server';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
export async function saveApplication(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  if (!name || !slug) throw new Error( 'Name and slug are required' );

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
  
  let appId = id;
  if (id) { 
    await prisma.application.update({ where: { id }, data }); 
  } else { 
    const created = await prisma.application.create({ data }); 
    appId = created.id;
  }
  
  const screenshotsStr = formData.get('screenshotsData') as string;
  if (screenshotsStr && appId) {
    try {
      const parsed = JSON.parse(screenshotsStr);
      await prisma.applicationScreenshot.deleteMany({ where: { applicationId: appId } });
      if (parsed.length > 0) {
        await prisma.applicationScreenshot.createMany({
          data: parsed.filter((s:any) => s.mediaAssetId).map((s:any) => ({
            applicationId: appId as string,
            mediaAssetId: s.mediaAssetId,
            order: s.order
          }))
        });
      }
    } catch(e) {}
  }

  revalidatePath('/admin/apps'); revalidatePath('/apps'); revalidatePath('/'); revalidatePath('/apps/' + slug);
  redirect('/admin/apps');
}
export async function deleteApplication(id: string) {
  await prisma.application.delete({ where: { id } });
  revalidatePath('/admin/apps'); revalidatePath('/apps'); revalidatePath('/');
  redirect('/admin/apps');
}
