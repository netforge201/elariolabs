import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const app = await prisma.application.findUnique({ where: { slug: resolvedParams.slug, status: 'PUBLISHED' }, include: { ogImage: true } });
  if (!app) return {};
  return { title: app.seoTitle || `${app.name} | ElarioLabs`, description: app.seoDescription || app.shortDescription, openGraph: { title: app.ogTitle || app.seoTitle || app.name, description: app.ogDescription || app.seoDescription || app.shortDescription, images: app.ogImage ? [app.ogImage.url] : [], } };
}
export default async function AppDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const app = await prisma.application.findUnique({ where: { slug: resolvedParams.slug, status: 'PUBLISHED' }, include: { logo: true, heroImage: true, screenshots: { include: { mediaAsset: true }, orderBy: { order: 'asc' } } } });
  if (!app) notFound();
  return (
    <article className="max-w-5xl mx-auto px-6 py-20">
      <header className="flex flex-col md:flex-row items-start md:items-center gap-8 mb-16">
        {app.logo && <img src={app.logo.url} alt="" className="w-24 h-24 md:w-32 md:h-32 rounded-2xl shadow-sm" />}
        <div className="flex-1">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">{app.name}</h1>
          <p className="text-xl text-zinc-500 dark:text-zinc-400 mb-6 max-w-2xl">{app.shortDescription}</p>
          <div className="flex flex-wrap items-center gap-4">
            {app.appStoreStatus === 'AVAILABLE' && app.appStoreUrl ? (
              <a href={app.appStoreUrl} target="_blank" rel="noopener noreferrer" className="inline-block"><img src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us?size=250x83&amp;releaseDate=1384473600" alt="Download on the App Store" className="h-10 md:h-12 w-auto" /></a>
            ) : app.appStoreStatus === 'COMING_SOON' ? (
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-sm font-medium">Coming Soon to the App Store</span>
            ) : null}
          </div>
        </div>
      </header>
      {app.heroImage && (
        <div className="w-full aspect-video md:aspect-[2/1] rounded-3xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 mb-16">
          <img src={app.heroImage.url} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="md:col-span-2 prose prose-zinc dark:prose-invert max-w-none">
          {app.fullDescription.split('\n').map((paragraph, i) => <p key={i}>{paragraph}</p>)}
        </div>
        <div className="space-y-8">
          <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-zinc-500">Information</h3>
            <div className="flex justify-between text-sm"><span className="text-zinc-500">Platform</span><span className="font-medium">{app.platform}</span></div>
            {app.version && <div className="flex justify-between text-sm"><span className="text-zinc-500">Version</span><span className="font-medium">{app.version}</span></div>}
            {app.price && <div className="flex justify-between text-sm"><span className="text-zinc-500">Price</span><span className="font-medium">{app.price}</span></div>}
          </div>
          {(app.privacyPolicyUrl || app.termsOfUseUrl || app.supportUrl) && (
            <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-4">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-zinc-500">Links</h3>
              {app.privacyPolicyUrl && <a href={app.privacyPolicyUrl} className="block text-sm text-blue-600 hover:underline">Privacy Policy</a>}
              {app.termsOfUseUrl && <a href={app.termsOfUseUrl} className="block text-sm text-blue-600 hover:underline">Terms of Use</a>}
              {app.supportUrl && <a href={app.supportUrl} className="block text-sm text-blue-600 hover:underline">Support</a>}
            </div>
          )}
        </div>
      </div>
      {app.screenshots.length > 0 && (
        <div className="mt-20">
          <h2 className="text-2xl font-semibold mb-8">Screenshots</h2>
          <div className="flex overflow-x-auto gap-6 pb-8 snap-x">
            {app.screenshots.map((s) => (
              <div key={s.id} className="snap-center shrink-0 w-64 md:w-80 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-black">
                <img src={s.mediaAsset.url} alt={s.mediaAsset.altText || 'Screenshot'} className="w-full h-auto object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
