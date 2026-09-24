import { prisma } from '@/lib/db';
import { format } from 'date-fns';
import MediaUpload from './MediaUpload';
export default async function MediaPage() {
  const assets = await prisma.mediaAsset.findMany({ orderBy: { createdAt: 'desc' } });
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Media Library</h1>
        <MediaUpload />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {assets.map((asset) => (
          <div key={asset.id} className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950 group relative">
            <div className="aspect-square bg-zinc-100 dark:bg-zinc-900 relative"><img src={asset.url} alt={asset.altText || ''} className="w-full h-full object-cover" /></div>
            <div className="p-3">
              <p className="text-xs font-medium truncate mb-1" title={asset.originalName}>{asset.originalName}</p>
              <p className="text-[10px] text-zinc-500">{(asset.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
