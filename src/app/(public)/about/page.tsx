import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';

export default async function AboutPage() {
  const company = await prisma.companyInformation.findFirst();
  
  if (!company?.about) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-32 text-center">
        <h1 className="text-4xl font-bold mb-4">About Us</h1>
        <p className="text-zinc-400">Information coming soon.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-24 md:py-32">
      <p className="text-xs font-semibold tracking-widest uppercase text-[#00e599] mb-4">About ElarioLabs</p>
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight mb-16">
        Designing software that <br/><span className="text-zinc-500">makes sense.</span>
      </h1>
      
      <div className="prose prose-invert prose-lg prose-p:text-zinc-400 prose-p:leading-relaxed prose-p:mb-6 max-w-none">
        {company.about.split('\n').map((paragraph, index) => (
          paragraph.trim() ? <p key={index}>{paragraph}</p> : <br key={index} />
        ))}
      </div>
      
      <div className="mt-24 pt-12 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
          <h3 className="text-sm font-semibold text-white mb-2">Location</h3>
          <p className="text-zinc-400 text-sm">{company.city || ''}, {company.country || 'Global'}</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white mb-2">Contact</h3>
          <p className="text-zinc-400 text-sm">
            {company.email && <a href={`mailto:${company.email}`} className="hover:text-[#00e599] transition-colors block">{company.email}</a>}
            {company.phone && <span className="block mt-1">{company.phone}</span>}
          </p>
        </div>
      </div>
    </div>
  );
}
