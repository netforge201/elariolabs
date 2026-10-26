import type {Metadata} from 'next';import {getSocialLinks} from '@/lib/social';import {notFound} from 'next/navigation';import {db} from '@/lib/db';import {getNav,getSetting} from '@/lib/settings';import {PublicFrame} from '../../components';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const {slug}=await params;
  const doc=await db.legalDocument.findFirst({where:{slug,status:'PUBLISHED'}});
  if(!doc){
    return {title:'Document not found',robots:{index:false,follow:false}};
  }

  const title=doc.seoTitle?.trim()||`${doc.title} | ElarioLabs`;
  const description=doc.seoDescription?.trim()||`${doc.title}. Read the official ${doc.type.toLowerCase()} document published by ElarioLabs.`;

  return {
    title,
    description,
    alternates:{canonical:`/legal/${doc.slug}`},
    openGraph:{
      type:'website',
      siteName:'ElarioLabs',
      title,
      description,
      url:`/legal/${doc.slug}`,
    },
    robots:{index:true,follow:true},
  };
}

export const dynamic='force-dynamic';
export default async function LegalPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const doc=await db.legalDocument.findFirst({where:{slug,status:'PUBLISHED'}});if(!doc)notFound();const [nav,copyright,logoUrl,socialLinks,contactEmail,contactPhone]=await Promise.all([getNav(),getSetting('copyright','© ElarioLabs'),getSetting<string>('brand.logoUrl',''),getSocialLinks(),getSetting<string>('contact.email',''),getSetting<string>('contact.phone','')]);return <PublicFrame items={nav.filter((n:any)=>n.group==='header'&&n.href!=='/support')} copyright={copyright} logoUrl={logoUrl} socialLinks={socialLinks} contactEmail={contactEmail} contactPhone={contactPhone}><div className="shell"><article className="hero"><div className="eyebrow">Legal · Effective {doc.effectiveDate?.toLocaleDateString()||'date not specified'}</div><h1>{doc.title}</h1><div className="content-copy">{doc.content}</div></article></div></PublicFrame>}
