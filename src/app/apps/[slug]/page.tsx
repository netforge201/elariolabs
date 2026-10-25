import {notFound} from 'next/navigation';
import {db} from '@/lib/db';
import {getNav,getSetting} from '@/lib/settings';
import {getSocialLinks} from '@/lib/social';
import {PublicFrame} from '../../components';

export const dynamic='force-dynamic';
const imageUrl=(key:string)=>key.startsWith('http')?key:`/media/${key}`;

export default async function AppDetail({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const app=await db.application.findFirst({where:{slug,contentState:'PUBLISHED'},include:{category:true,platforms:{include:{platform:true}},features:{orderBy:{sortOrder:'asc'}},media:{include:{asset:true},orderBy:{sortOrder:'asc'}},legalDocuments:{where:{status:'PUBLISHED'}}}});
  if(!app)notFound();
  const [nav,copyright,logoUrl,socialLinks,contactEmail,contactPhone]=await Promise.all([getNav(),getSetting('copyright','© ElarioLabs'),getSetting<string>('brand.logoUrl',''),getSocialLinks(),getSetting<string>('contact.email',''),getSetting<string>('contact.phone','')]);
  const icon=app.media.find(x=>x.role==='ICON')?.asset;
  const cover=app.media.find(x=>x.role==='COVER')?.asset;
  const screenshots=app.media.filter(x=>x.role==='SCREENSHOT');
  const coverSrc=cover?imageUrl(cover.storageKey):app.coverUrl;
  const iconSrc=icon?imageUrl(icon.storageKey):app.iconUrl;
  const stores=app.platforms.filter(x=>x.url&&/^https:\/\//i.test(x.url));
  return <PublicFrame items={nav.filter((n:any)=>n.group==='header'&&n.href!=='/support')} copyright={copyright} logoUrl={logoUrl} socialLinks={socialLinks} contactEmail={contactEmail} contactPhone={contactPhone}>
    <div className="shell app-page">
      <nav className="app-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/apps">Applications</a><span>/</span><span>{app.name}</span></nav>
      <section className="app-hero">
        <div className="app-hero-copy">
          <span className="eyebrow">{app.category?.name||'ElarioLabs application'} <span aria-hidden="true">·</span> {app.availability.replace('_',' ').toLowerCase()}</span>
          <div className="app-title-lockup">{iconSrc&&<img className="app-icon" src={iconSrc} alt={icon?.altText||`${app.name} icon`}/>}<h1>{app.name}</h1></div>
          {app.tagline&&<p className="app-tagline">{app.tagline}</p>}
          <p className="app-summary">{app.shortDescription}</p>
          {app.availability==='AVAILABLE'&&stores.length>0&&<div className="app-store-actions">{stores.map(x=><a className="btn-primary" href={x.url!} key={x.id} rel="noopener noreferrer">{x.label||`Get for ${x.platform.name}`} <span aria-hidden="true">↗</span></a>)}</div>}
          {app.availability==='COMING_SOON'&&<p className="notice">Coming soon. <a href="/contact">Contact us for updates.</a></p>}
          {app.availability==='DISCONTINUED'&&<p className="notice">This application is discontinued.</p>}
        </div>
        {coverSrc&&<figure className="app-cover-frame"><img src={coverSrc} alt={cover?.altText||`${app.name} preview`} /><figcaption>Introducing {app.name}</figcaption></figure>}
      </section>
      <div className="app-facts">{app.platforms.length>0&&<div><span className="eyebrow">Available on</span><div className="app-pills">{app.platforms.map(x=><span className="app-pill" key={x.id}>{x.platform.name}</span>)}</div></div>}{app.pricingLabel&&<div><span className="eyebrow">Pricing</span><strong>{app.pricingLabel}</strong></div>}{app.bundleId&&<div><span className="eyebrow">Bundle ID</span><code>{app.bundleId}</code></div>}</div>
      {app.description&&<section className="app-section app-description"><div><span className="eyebrow">Overview</span><h2>About {app.name}</h2></div><div className="content-copy">{app.description}</div></section>}
      {app.features.length>0&&<section className="app-section"><div className="app-section-heading"><span className="eyebrow">What you can do</span><h2>Thoughtful by design.</h2></div><div className="app-feature-grid">{app.features.map((f,i)=><article className="app-feature" key={f.id}><span className="app-feature-number">{String(i+1).padStart(2,'0')}</span><h3>{f.title}</h3><p>{f.body}</p></article>)}</div></section>}
      {screenshots.length>0&&<section className="app-section"><div className="app-section-heading"><span className="eyebrow">A closer look</span><h2>See it in action.</h2></div><div className="app-screenshots">{screenshots.map(x=><figure key={x.id}><img src={imageUrl(x.asset.storageKey)} alt={x.asset.altText||`${app.name} screenshot`}/></figure>)}</div></section>}
      <section className="app-bottom-panel"><div><span className="eyebrow">Need a hand?</span><h2>We’re here to help.</h2><p>Questions about {app.name}? Get in touch with the studio.</p></div><a className="btn" href="/contact">Contact ElarioLabs <span aria-hidden="true">↗</span></a></section>
      {app.legalDocuments.length>0&&<nav className="app-legal-links" aria-label="Application policies">{app.legalDocuments.map(d=><a key={d.id} href={`/legal/${d.slug}`}>{d.title}</a>)}</nav>}
    </div>
  </PublicFrame>
}
