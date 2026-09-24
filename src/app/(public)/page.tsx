import { prisma } from '@/lib/db';
import Link from 'next/link';
import { FAQ } from '@/components/FAQ';
import { ArrowRight, Apple, Code2, Users, Diamond, Smartphone, LayoutTemplate, Rocket, Lightbulb, PenTool, Code, Plus } from 'lucide-react';

export default async function Home() {
  const settings = await prisma.siteSettings.findFirst({ include: { heroImage: true } });

  const latestApps = await prisma.application.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: { logo: true, heroImage: true }
  });

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* 1. HERO SECTION */}
      <section className="relative px-6 py-24 md:py-32 max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center gap-16">
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#00e599]/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
        
        <div className="flex-1 space-y-8 z-10">
          <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400">iOS App Development Studio</p>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
            We build<br/>and publish<br/>iOS <span className="text-[#00e599]">apps.</span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-md leading-relaxed">
            ElarioLabs is an independent iOS app development studio. We design, develop and release useful, high-quality applications for everyone on the App Store.
          </p>
          <Link href="/apps" className="inline-flex items-center gap-2 px-8 py-4 bg-[#00e599] text-black font-semibold rounded-full hover:bg-[#00e599]/90 transition-colors">
            Explore Our Apps <ArrowRight className="w-4 h-4" />
          </Link>
          
          <div className="flex flex-wrap items-start gap-8 pt-12 border-t border-white/10 mt-12">
            <div className="flex items-start gap-3">
              <Apple className="w-5 h-5 text-[#00e599] mt-1" />
              <div><h4 className="text-sm font-semibold text-white">App Store Focused</h4><p className="text-xs text-zinc-500">Real products.<br/>For real users.</p></div>
            </div>
            <div className="flex items-start gap-3">
              <Code2 className="w-5 h-5 text-[#00e599] mt-1" />
              <div><h4 className="text-sm font-semibold text-white">Full Development Cycle</h4><p className="text-xs text-zinc-500">From idea to release.</p></div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-[#00e599] mt-1" />
              <div><h4 className="text-sm font-semibold text-white">Independent Studio</h4><p className="text-xs text-zinc-500">Focused on quality<br/>and usability.</p></div>
            </div>
          </div>
        </div>

        <div className="flex-1 relative z-10 hidden md:block">
          <div className="relative w-full max-w-sm mx-auto aspect-[1/2] rounded-[3rem] border-[8px] border-zinc-900 bg-black shadow-2xl shadow-[#00e599]/20 overflow-hidden transform rotate-6">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-7 bg-zinc-900 rounded-b-3xl z-50" />
            {settings?.heroImage?.url ? (
              <img src={settings.heroImage.url} alt="" className="w-full h-full object-cover" />
            ) : (
            <div className="w-full h-full bg-zinc-950 p-4 pt-12 flex flex-col gap-4">
              <div className="text-white text-xl font-bold mb-4">Today</div>
              
              {/* Mock App Cards */}
              <div className="w-full h-48 bg-gradient-to-br from-[#00e599]/40 to-[#00e599]/10 rounded-2xl p-4 flex flex-col justify-end border border-white/5">
                <h3 className="text-white font-bold">LandlordTaxPack</h3>
                <p className="text-[10px] text-zinc-300">Track, organize and prep your rental records.</p>
              </div>
              
              <div className="w-full bg-zinc-900 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-xl" />
                <div className="flex-1">
                  <h3 className="text-white text-sm font-bold">FocusFlow</h3>
                  <p className="text-[10px] text-zinc-400">Build better habits</p>
                </div>
                <div className="px-3 py-1 bg-white/10 rounded-full text-xs text-[#00e599] font-bold">Get</div>
              </div>

              <div className="w-full bg-zinc-900 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-500 rounded-xl" />
                <div className="flex-1">
                  <h3 className="text-white text-sm font-bold">TravelLog</h3>
                  <p className="text-[10px] text-zinc-400">Capture your journeys</p>
                </div>
                <div className="px-3 py-1 bg-white/10 rounded-full text-xs text-[#00e599] font-bold">Get</div>
              </div>
            </div>)}
          </div>
        </div>
      </section>

      {/* 2. ABOUT SECTION */}
      <section className="px-6 py-24 max-w-7xl mx-auto w-full">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 w-full aspect-video rounded-3xl bg-zinc-900 overflow-hidden relative border border-white/5">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#00e599]/10 to-transparent mix-blend-overlay" />
            <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center grayscale opacity-50" />
          </div>
          <div className="flex-1 space-y-6">
            <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500">About ElarioLabs</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
              Independent<br/><span className="text-[#00e599]">iOS app studio.</span>
            </h2>
            <p className="text-zinc-400 leading-relaxed text-lg max-w-lg">
              We create our own iOS applications and publish them on the App Store. Our focus is on clean design, useful features and a smooth user experience.
            </p>
            <Link href="/about" className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white border border-white/10 font-semibold rounded-full hover:bg-zinc-800 transition-colors mt-4">
              Learn More <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. APPS SECTION */}
      <section className="px-6 py-24 max-w-7xl mx-auto w-full border-t border-white/5 mt-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-4">Our Apps</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
              Useful apps<br/>for <span className="text-[#00e599]">everyday life.</span>
            </h2>
          </div>
          <Link href="/apps" className="text-[#00e599] font-medium flex items-center gap-2 hover:underline">
            View All Apps <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {latestApps.map(app => (
            <div key={app.id} className="bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden flex flex-col group hover:border-[#00e599]/50 transition-colors">
              <div className="w-full aspect-[4/3] bg-zinc-900 relative p-6 flex items-end justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                {app.heroImage ? <img src={app.heroImage.url} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" /> : <div className="absolute inset-0 w-full h-full bg-zinc-800" />}
              </div>
              <div className="p-8 pt-6 flex-1 flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  {app.logo ? <img src={app.logo.url} alt="" className="w-12 h-12 rounded-xl" /> : <div className="w-12 h-12 bg-zinc-800 rounded-xl" />}
                  <h3 className="text-xl font-bold text-white">{app.name}</h3>
                </div>
                <p className="text-sm text-zinc-400 mb-8 flex-1">{app.shortDescription}</p>
                <Link href={`/apps/${app.slug}`} className="inline-flex items-center justify-center gap-2 w-full py-3 bg-[#111] border border-white/5 rounded-2xl text-sm font-semibold hover:bg-[#1a1a1a] transition-colors text-zinc-200">
                  View on App Store <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
          {latestApps.length === 0 && <div className="col-span-full py-20 text-center text-zinc-500">No applications published yet.</div>}
        </div>
      </section>

      {/* 4. FEATURES SECTION */}
      <section className="px-6 py-24 max-w-7xl mx-auto w-full border-t border-white/5 mt-12">
        <div className="flex flex-col lg:flex-row gap-16">
          <div className="w-full lg:w-1/3">
            <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-4">Why ElarioLabs</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
              We focus on what<br/><span className="text-[#00e599]">really matters.</span>
            </h2>
          </div>
          <div className="w-full lg:w-2/3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-12">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6"><Diamond className="w-6 h-6 text-[#00e599]" /></div>
              <h3 className="text-white font-bold mb-3">High-Quality<br/>Apps</h3>
              <p className="text-sm text-zinc-400">Clean, modern and reliable.</p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6"><Smartphone className="w-6 h-6 text-[#00e599]" /></div>
              <h3 className="text-white font-bold mb-3">Native iOS<br/>Experience</h3>
              <p className="text-sm text-zinc-400">Built with Swift and modern technologies.</p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6"><LayoutTemplate className="w-6 h-6 text-[#00e599]" /></div>
              <h3 className="text-white font-bold mb-3">User-Centered<br/>Design</h3>
              <p className="text-sm text-zinc-400">Simple, intuitive and beautiful interfaces.</p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6"><Rocket className="w-6 h-6 text-[#00e599]" /></div>
              <h3 className="text-white font-bold mb-3">From Idea<br/>to App Store</h3>
              <p className="text-sm text-zinc-400">We handle the full process — design, development, testing and publication.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PROCESS SECTION */}
      <section id="process" className="px-6 py-24 max-w-7xl mx-auto w-full border-t border-white/5 mt-12">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <div className="w-full lg:w-1/3">
            <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-4">Our Process</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
              From idea<br/>to <span className="text-[#00e599]">App Store.</span>
            </h2>
          </div>
          
          <div className="w-full lg:w-2/3 relative">
            <div className="absolute top-8 left-6 right-6 h-0.5 border-t-2 border-dashed border-white/10 hidden md:block" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="relative z-10 flex flex-col items-start">
                <div className="w-16 h-16 rounded-full bg-[#050505] border-2 border-white/10 flex items-center justify-center mb-6"><Lightbulb className="w-6 h-6 text-white" /></div>
                <h4 className="text-white font-bold text-sm mb-2">1. Idea</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">Define the concept and core features.</p>
              </div>
              <div className="relative z-10 flex flex-col items-start">
                <div className="w-16 h-16 rounded-full bg-[#050505] border-2 border-white/10 flex items-center justify-center mb-6"><PenTool className="w-6 h-6 text-white" /></div>
                <h4 className="text-white font-bold text-sm mb-2">2. Design</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">Create clean and intuitive UI/UX.</p>
              </div>
              <div className="relative z-10 flex flex-col items-start">
                <div className="w-16 h-16 rounded-full bg-[#050505] border-2 border-white/10 flex items-center justify-center mb-6"><Code className="w-6 h-6 text-white" /></div>
                <h4 className="text-white font-bold text-sm mb-2">3. Develop</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">Build and test the application.</p>
              </div>
              <div className="relative z-10 flex flex-col items-start">
                <div className="w-16 h-16 rounded-full bg-[#050505] border-2 border-white/10 flex items-center justify-center mb-6"><Apple className="w-6 h-6 text-white" /></div>
                <h4 className="text-white font-bold text-sm mb-2">4. Publish</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">Release on the App Store for everyone to use.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ SECTION */}
      <section id="faq" className="px-6 py-24 max-w-7xl mx-auto w-full border-t border-white/5 mt-12">
        <div className="flex flex-col lg:flex-row gap-16">
          <div className="w-full lg:w-1/3">
            <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-4">FAQ</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
              Frequently<br/>Asked <span className="text-[#00e599]">Questions.</span>
            </h2>
          </div>
          <div className="w-full lg:w-2/3">
            <FAQ />
          </div>
        </div>
      </section>

      {/* 7. BOTTOM CTA */}
      <section className="px-6 py-24 max-w-7xl mx-auto w-full">
        <div className="relative w-full rounded-3xl overflow-hidden p-12 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 border border-white/10 bg-[#081f14] border-none">
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-l from-[#00e599]/10 to-transparent pointer-events-none" />
          
          <div className="relative z-10 max-w-lg">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Check out our apps on <span className="text-[#00e599]">the App Store.</span></h2>
            <p className="text-zinc-400">Discover our latest releases and see what we're building.</p>
          </div>
          
          <div className="relative z-10 flex items-center gap-6">
            <Link href="/apps" className="inline-flex items-center gap-2 px-8 py-4 bg-[#00e599] text-black font-bold rounded-full hover:bg-[#00e599]/90 transition-colors">
              View Our Apps <ArrowRight className="w-4 h-4" />
            </Link>
            <div className="w-16 h-16 rounded-2xl bg-blue-500 flex items-center justify-center shrink-0 shadow-[0_0_40px_rgba(59,130,246,0.5)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 170 170" fill="white"><path d="M121.75 97.43c-.2-15.5 12.67-24.64 13.25-25.04-7.23-10.57-18.5-12.02-22.56-12.18-9.6-.96-18.73 5.67-23.6 5.67-4.87 0-12.44-5.52-20.4-5.36-10.35.15-19.92 6-25.26 15.35-10.83 18.94-2.77 46.96 7.82 62.24 5.16 7.45 11.23 15.7 19.34 15.42 7.78-.3 10.74-5 20.08-5 9.33 0 12 5 20.08 4.86 8.36-.15 13.68-7.55 18.7-14.86 5.8-8.42 8.2-16.57 8.3-17-.18-.08-15.58-5.96-15.75-24.1zM111 37.64c4.27-5.16 7.15-12.33 6.36-19.5-6.18.25-13.78 4.12-18.22 9.25-3.95 4.54-7.3 11.83-6.4 18.9 6.9 0.54 13.9-3.48 18.26-8.65z"/></svg>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
