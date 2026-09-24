cat << 'INNER_EOF' > "src/app/(public)/layout.tsx"
import Header from '@/components/public/Header';
import Footer from '@/components/public/Footer';
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 selection:bg-zinc-200 dark:selection:bg-zinc-800">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
INNER_EOF

cat << 'INNER_EOF' > "src/app/(public)/apps/page.tsx"
import { prisma } from '@/lib/db';
import Link from 'next/link';
export default async function PublicAppsPage() {
  const apps = await prisma.application.findMany({ where: { status: 'PUBLISHED' }, orderBy: { createdAt: 'desc' }, include: { logo: true, heroImage: true } });
  return (
    <div className="max-w-5xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-semibold tracking-tight mb-4">Our Applications</h1>
      <p className="text-zinc-500 dark:text-zinc-400 text-lg mb-12">Software carefully crafted for the best experience.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {apps.map(app => (
          <Link key={app.id} href={`/apps/${app.slug}`} className="group block">
            <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl overflow-hidden transition-all group-hover:border-zinc-300 dark:group-hover:border-zinc-600">
              <div className="aspect-video bg-zinc-200 dark:bg-zinc-800 relative">
                {app.heroImage ? <img src={app.heroImage.url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-zinc-400">No Hero Image</div>}
              </div>
              <div className="p-8">
                <div className="flex items-center gap-4 mb-4">
                  {app.logo && <img src={app.logo.url} alt="" className="w-12 h-12 rounded-xl shadow-sm" />}
                  <h2 className="text-2xl font-semibold">{app.name}</h2>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400">{app.shortDescription}</p>
                <div className="mt-6 inline-flex items-center text-sm font-medium text-blue-600 group-hover:underline">Learn more &rarr;</div>
              </div>
            </div>
          </Link>
        ))}
        {apps.length === 0 && <div className="col-span-full py-12 text-center text-zinc-500">No applications available at the moment.</div>}
      </div>
    </div>
  );
}
INNER_EOF

cat << 'INNER_EOF' > "src/app/(public)/apps/[slug]/page.tsx"
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
INNER_EOF

cat << 'INNER_EOF' > "src/app/(public)/blog/page.tsx"
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { format } from 'date-fns';
export default async function PublicBlogPage() {
  const articles = await prisma.blogArticle.findMany({ where: { status: 'PUBLISHED' }, orderBy: { publishedAt: 'desc' }, include: { coverImage: true } });
  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-semibold tracking-tight mb-4">Blog</h1>
      <p className="text-zinc-500 dark:text-zinc-400 text-lg mb-12">News, updates, and thoughts from ElarioLabs.</p>
      <div className="space-y-12">
        {articles.map((article) => (
          <article key={article.id} className="group relative flex flex-col md:flex-row gap-8 items-start">
            {article.coverImage && (
              <div className="w-full md:w-1/3 aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 shrink-0">
                <img src={article.coverImage.url} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
              </div>
            )}
            <div className="flex-1">
              <time className="text-sm text-zinc-500 mb-2 block">{article.publishedAt ? format(article.publishedAt, 'MMMM d, yyyy') : ''}</time>
              <h2 className="text-2xl font-semibold mb-3">
                <Link href={`/blog/${article.slug}`}>
                  <span className="absolute inset-0" />
                  {article.title}
                </Link>
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-3">{article.excerpt}</p>
              <div className="text-sm font-medium text-blue-600 group-hover:underline">Read article &rarr;</div>
            </div>
          </article>
        ))}
        {articles.length === 0 && <div className="py-12 text-center text-zinc-500">No articles published yet.</div>}
      </div>
    </div>
  );
}
INNER_EOF

cat << 'INNER_EOF' > "src/app/(public)/blog/[slug]/page.tsx"
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import type { Metadata } from 'next';
import DOMPurify from 'isomorphic-dompurify';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const article = await prisma.blogArticle.findUnique({ where: { slug: resolvedParams.slug, status: 'PUBLISHED' }, include: { ogImage: true } });
  if (!article) return {};
  return { title: article.seoTitle || `${article.title} | ElarioLabs Blog`, description: article.seoDescription || article.excerpt, openGraph: { title: article.ogTitle || article.seoTitle || article.title, description: article.ogDescription || article.seoDescription || article.excerpt || undefined, images: article.ogImage ? [article.ogImage.url] : [], } };
}
export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const article = await prisma.blogArticle.findUnique({ where: { slug: resolvedParams.slug, status: 'PUBLISHED' }, include: { coverImage: true } });
  if (!article) notFound();
  const cleanContent = DOMPurify.sanitize(article.content);
  return (
    <article className="max-w-3xl mx-auto px-6 py-20">
      <header className="mb-12">
        <div className="text-sm text-zinc-500 mb-4 space-x-2">
          {article.publishedAt && <time dateTime={article.publishedAt.toISOString()}>{format(article.publishedAt, 'MMMM d, yyyy')}</time>}
          <span>&middot;</span><span>{article.author || 'ElarioLabs Studio'}</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">{article.title}</h1>
        {article.excerpt && <p className="text-xl text-zinc-500 dark:text-zinc-400">{article.excerpt}</p>}
      </header>
      {article.coverImage && (
        <div className="w-full aspect-[16/9] md:aspect-[2/1] rounded-3xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 mb-12">
          <img src={article.coverImage.url} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="prose prose-zinc dark:prose-invert prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: cleanContent }} />
    </article>
  );
}
INNER_EOF

cat << 'INNER_EOF' > "src/app/(public)/[slug]/page.tsx"
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import DOMPurify from 'isomorphic-dompurify';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const page = await prisma.staticPage.findUnique({ where: { slug: resolvedParams.slug, status: 'PUBLISHED' }, include: { ogImage: true } });
  if (!page) return {};
  return { title: page.seoTitle || `${page.title} | ElarioLabs`, description: page.seoDescription, openGraph: { images: page.ogImage ? [page.ogImage.url] : [], } };
}
export default async function StaticPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const page = await prisma.staticPage.findUnique({ where: { slug: resolvedParams.slug, status: 'PUBLISHED' } });
  if (!page) notFound();
  const cleanContent = DOMPurify.sanitize(page.content);
  return (
    <article className="max-w-3xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-semibold tracking-tight mb-12">{page.title}</h1>
      <div className="prose prose-zinc dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: cleanContent }} />
    </article>
  );
}
INNER_EOF

