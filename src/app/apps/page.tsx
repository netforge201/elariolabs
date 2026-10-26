import type {Metadata} from 'next';
import {getSocialLinks} from '@/lib/social';import Link from 'next/link';import { db } from '@/lib/db';import {getNav,getSetting} from '@/lib/settings';import {PublicFrame} from '../components';
export const metadata:Metadata = {
  title: {absolute:'Mobile Apps & Software Products | ElarioLabs'},
  description:'Explore applications developed by ElarioLabs. Discover product details, features, supported platforms, pricing information, and official download links.',
  alternates:{canonical:'/apps'},
  openGraph:{
    type:'website',
    siteName:'ElarioLabs',
    title:'Mobile Apps & Software Products | ElarioLabs',
    description:'Explore ElarioLabs applications, features, supported platforms, and official download links.',
    url:'/apps',
  },
  twitter:{
    card:'summary',
    title:'Mobile Apps & Software Products | ElarioLabs',
    description:'Explore ElarioLabs applications, features, and official download links.',
  },
};

export const dynamic='force-dynamic';
export default async function Apps({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){const q=await searchParams;const statuses=Array.isArray(q.status)?q.status:[q.status].filter((x):x is string=>typeof x==='string');const all=await db.application.count({where:{contentState:'PUBLISHED'}});const [nav,copyright,logoUrl,socialLinks,contactEmail,contactPhone]=await Promise.all([getNav(),getSetting('copyright','© ElarioLabs'),getSetting<string>('brand.logoUrl',''),getSocialLinks(),getSetting<string>('contact.email',''),getSetting<string>('contact.phone','')]);let where:any={contentState:'PUBLISHED'};if(statuses.length){const validStatuses=statuses.map(status=>status.toUpperCase()).filter(status=>['AVAILABLE','COMING_SOON','DISCONTINUED'].includes(status));if(validStatuses.length)where.availability={in:validStatuses};else where.availability={not:'DISCONTINUED'};}else where.availability={not:'DISCONTINUED'};if(q.q)where.OR=[{name:{contains:q.q,mode:'insensitive'}},{shortDescription:{contains:q.q,mode:'insensitive'}}];if(q.category)where.category={slug:q.category};if(q.platform)where.platforms={some:{platform:{slug:q.platform}}};const orderBy=q.sort==='az'?[{name:'asc'}]:q.sort==='za'?[{name:'desc'}]:q.sort==='recent'?[{updatedAt:'desc'}]:[{displayOrder:'asc'},{name:'asc'}];const apps=all?await db.application.findMany({where,include:{category:true,platforms:{include:{platform:true}},media:{where:{role:{in:['ICON','COVER']}},include:{asset:true},orderBy:{sortOrder:'asc'}}},orderBy:orderBy as any}):[];if(!q.sort||q.sort==='featured')apps.sort((a,b)=>Number(b.featured)-Number(a.featured)||a.displayOrder-b.displayOrder||a.name.localeCompare(b.name));const [categories,platforms]=all?await Promise.all([db.category.findMany({orderBy:{sortOrder:'asc'}}),db.platform.findMany({orderBy:{sortOrder:'asc'}})]):[[],[]];return <PublicFrame items={nav.filter((n:any)=>n.group==='header'&&n.href!=='/support')} copyright={copyright} logoUrl={logoUrl} socialLinks={socialLinks} contactEmail={contactEmail} contactPhone={contactPhone}>
<div className="shell apps-catalog">
  <section className="apps-heading">
    <span className="eyebrow">The catalog</span>
    <h1>Applications</h1>
    <p>Discover software made by ElarioLabs.</p>
  </section>
  {!all ? <section className="empty"><div className="eyebrow">A fresh start</div><h2 style={{marginTop:'.75rem'}}>Applications are on the way.</h2><p>There are no published applications yet. Please check back later.</p><Link href="/" className="btn">Back to home</Link></section> : <>
    <form className="apps-search" action="/apps">
      <label className="apps-search-field">
        <span aria-hidden="true">⌕</span>
        <input name="q" aria-label="Search applications" placeholder="Search applications..." defaultValue={q.q}/>
      </label>
      {q.category&&<input type="hidden" name="category" value={q.category}/>}
      {q.platform&&<input type="hidden" name="platform" value={q.platform}/>}
      {statuses.map(status=><input key={status} type="hidden" name="status" value={status}/>)}
      {q.sort&&<input type="hidden" name="sort" value={q.sort}/>}
      <button className="btn-primary" type="submit">Search</button>
    </form>
    <div className="apps-layout">
      <aside className="apps-filter-panel">
        <div className="apps-filter-heading"><h2>Filters</h2><Link href="/apps">Reset all</Link></div>
        <form action="/apps" className="apps-filter-form">
          {q.q&&<input type="hidden" name="q" value={q.q}/>}
          <label className="apps-filter-group"><span>Category</span><select name="category" defaultValue={q.category||''}><option value="">All categories</option>{categories.map(c=><option key={c.id} value={c.slug}>{c.name}</option>)}</select></label>
          <label className="apps-filter-group"><span>Platform</span><select name="platform" defaultValue={q.platform||''}><option value="">Any platform</option>{platforms.map(p=><option key={p.id} value={p.slug}>{p.name}</option>)}</select></label>
          <fieldset className="apps-filter-group apps-status-group"><legend>Status</legend>{[{value:'available',label:'Available'},{value:'coming_soon',label:'Coming soon'},{value:'discontinued',label:'Discontinued'}].map(x=><label key={x.value}><input type="checkbox" name="status" value={x.value} defaultChecked={statuses.some(status=>status.toLowerCase()===x.value)}/><span>{x.label}</span></label>)}</fieldset>
          <label className="apps-filter-group"><span>Sort by</span><select name="sort" defaultValue={q.sort||'featured'}><option value="featured">Featured first</option><option value="az">Name A–Z</option><option value="za">Name Z–A</option><option value="recent">Recently updated</option></select></label>
          <button className="btn-primary apps-apply" type="submit">Apply filters</button>
          <Link className="apps-reset-mobile" href="/apps">Reset all filters</Link>
        </form>
      </aside>
      <section className="apps-results">
        <div className="apps-results-heading"><div><span className="eyebrow">Explore the collection</span><h2>Find your next favorite.</h2></div><span className="apps-result-count">{apps.length} {apps.length===1?'application':'applications'}</span></div>
        {apps.length ? <div className="cards apps-card-grid">{apps.map(app=><Link className="card product-card apps-product-card" href={`/apps/${app.slug}`} key={app.id}>
          {(app.coverUrl||app.media.find(m=>m.role==='COVER')?.asset)&&<img className="product-cover" src={app.media.find(m=>m.role==='COVER')?.asset?(app.media.find(m=>m.role==='COVER')!.asset.storageKey.startsWith('http')?app.media.find(m=>m.role==='COVER')!.asset.storageKey:`/media/${app.media.find(m=>m.role==='COVER')!.asset.storageKey}`):app.coverUrl!} alt={app.media.find(m=>m.role==='COVER')?.asset.altText||''}/>}
          <div className="apps-card-meta">{app.featured&&<span className="featured-badge">Featured</span>}<span className="mono">{app.category?.name||'Application'}</span></div>
          {(app.iconUrl||app.media.find(m=>m.role==='ICON')?.asset)&&<img src={app.media.find(m=>m.role==='ICON')?.asset?(app.media.find(m=>m.role==='ICON')!.asset.storageKey.startsWith('http')?app.media.find(m=>m.role==='ICON')!.asset.storageKey:`/media/${app.media.find(m=>m.role==='ICON')!.asset.storageKey}`):app.iconUrl!} alt={app.media.find(m=>m.role==='ICON')?.asset.altText||''} style={{width:52,height:52,objectFit:'cover',borderRadius:13,marginTop:'.85rem'}}/>}
          <h3 className="apps-card-title">{app.name}</h3><p>{app.shortDescription}</p><div className="apps-card-bottom"><span className="mono">{app.availability.replace('_',' ')}</span><span aria-hidden="true">↗</span></div>
        </Link>)}</div> : <section className="empty"><h2>No matching applications found</h2><p>Try changing your filters.</p><Link className="btn" href="/apps">Reset all filters</Link></section>}
      </section>
    </div>
  </>}
</div>
</PublicFrame>}
