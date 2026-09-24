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
