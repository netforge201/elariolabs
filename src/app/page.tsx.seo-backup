import type {Metadata} from 'next';
import {getSocialLinks} from '@/lib/social';import Link from 'next/link';
import { db } from '@/lib/db';
import { getNav,getSetting } from '@/lib/settings';
import { PublicFrame } from './components';
export const metadata:Metadata = {
  title: {absolute:'ElarioLabs — Thoughtfully Designed Software & Apps'},
  description:'Discover mobile apps and digital products created by ElarioLabs, an independent software studio building practical, thoughtfully designed software.',
  alternates:{canonical:'/'},
  openGraph:{
    type:'website',
    siteName:'ElarioLabs',
    title:'ElarioLabs — Thoughtfully Designed Software & Apps',
    description:'Discover mobile apps and digital products created by ElarioLabs.',
    url:'/',
  },
  twitter:{
    card:'summary',
    title:'ElarioLabs — Thoughtfully Designed Software & Apps',
    description:'Discover mobile apps and digital products created by ElarioLabs.',
  },
};

export const dynamic='force-dynamic';
export default async function Home(){const [nav,apps,page,tagline,copyright,logoUrl,heroImageUrl,socialLinks,supportEmail,contactPhone]=await Promise.all([getNav(),db.application.findMany({where:{contentState:'PUBLISHED',featured:true},orderBy:{displayOrder:'asc'},take:3,include:{category:true,media:{where:{role:'COVER'},include:{asset:true},take:1}}}),db.page.findUnique({where:{slug:'home'}}),getSetting('home.tagline','Independent software, thoughtfully made.'),getSetting('copyright','© ElarioLabs'),getSetting<string>('brand.logoUrl',''),getSetting<string>('home.heroImageUrl',''),getSocialLinks(),getSetting<string>('contact.email',''),getSetting<string>('contact.phone','')]);const data=(page?.content??{}) as {heroTitle?:string;heroBody?:string;introTitle?:string;introBody?:string};return <PublicFrame items={nav.filter((n:any)=>n.group==='header'&&n.href!=='/support')} copyright={copyright} logoUrl={logoUrl} socialLinks={socialLinks} contactEmail={supportEmail} contactPhone={contactPhone}>
<script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({
  "@context":"https://schema.org",
  "@graph":[
    {
      "@type":"Organization",
      "@id":"https://elariolabs.com/#organization",
      "name":"ElarioLabs",
      "url":"https://elariolabs.com/"
    },
    {
      "@type":"WebSite",
      "@id":"https://elariolabs.com/#website",
      "name":"ElarioLabs",
      "url":"https://elariolabs.com/",
      "publisher":{"@id":"https://elariolabs.com/#organization"}
    }
  ]
})}} />
<div className="shell"><section className="hero home-hero home-hero-with-image"><div className="home-hero-copy"><span className="eyebrow">Independent software studio</span><h1>{data.heroTitle||'Software made with care.'}</h1><p>{data.heroBody||tagline}</p><div className="actions"><Link className="btn btn-primary" href="/apps">Explore applications <span aria-hidden="true">↗</span></Link><Link className="btn" href="/about">About the studio</Link></div></div>{heroImageUrl && <div className="home-hero-art"><img src={heroImageUrl} alt="ElarioLabs applications" /></div>}</section>{apps.length>0&&<section className="section"><div style={{display:'flex',justifyContent:'space-between',alignItems:'end',marginBottom:'1.5rem'}}><div><span className="eyebrow">Selected work</span><h2>Featured applications</h2></div><Link href="/apps">All applications →</Link></div><div className="cards">{apps.map(app=><Link className="card product-card" key={app.id} href={`/apps/${app.slug}`}>{(app.coverUrl||app.media[0]?.asset)&&<img className="product-cover" src={app.media[0]?.asset?(app.media[0].asset.storageKey.startsWith('http')?app.media[0].asset.storageKey:`/media/${app.media[0].asset.storageKey}`):app.coverUrl!} alt={app.media[0]?.asset.altText||''}/>}<div className="mono">{app.category?.name||'Application'}</div><h3 style={{marginTop:'1rem'}}>{app.name}</h3><p>{app.shortDescription||app.tagline}</p></Link>)}</div></section>}<section className="section"><div className="cards"><div style={{gridColumn:'span 2'}}><span className="eyebrow">ElarioLabs</span><h2>{'Our own products, from first idea to release.'}</h2><p>{'ElarioLabs is an independent software studio building its own digital products—from the first idea and product design through development, testing, and release.'}</p><Link href="/about" className="btn">Learn about us</Link></div><div className="card"><div className="eyebrow">Need a hand?</div><h3>We’re here to help.</h3><p>Questions about our software or the studio? Get in touch.</p><a href={supportEmail?`mailto:${supportEmail}`:'/contact'} className="btn btn-primary">Contact the studio</a></div></div></section></div></PublicFrame>}
