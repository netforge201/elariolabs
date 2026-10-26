import {NextResponse} from 'next/server';
import {currentAdmin,sameOrigin,publicBase} from '@/lib/auth';
import {requirePermission} from '@/lib/permissions';
import {db} from '@/lib/db';

const networks=['instagram','facebook','x','linkedin','youtube','tiktok','github','telegram','threads','discord','bluesky','mastodon','pinterest','reddit','snapchat','whatsapp'] as const;

export async function POST(req:Request){
  if(!await sameOrigin(req))return new Response('Forbidden',{status:403});
  const user=await currentAdmin();
  if(!user)return NextResponse.redirect(new URL('/admin/login',publicBase(req)),303);
  if(!await requirePermission('settings.manage'))return new Response('Forbidden',{status:403});

  const form=await req.formData();
  for(const key of ['contact.email','contact.phone','copyright','home.tagline','seo.title','seo.description']){
    const value=form.get(key);
    if(typeof value==='string')await db.siteSetting.upsert({where:{key},create:{key,value},update:{value}});
  }
  const socialLinks:Record<string,string>={};
  for(const key of networks){
    const value=form.get(`social.${key}`);
    if(typeof value==='string'&&/^https:\/\//i.test(value.trim()))socialLinks[key]=value.trim();
  }
  await db.siteSetting.upsert({where:{key:'social.links'},create:{key:'social.links',value:socialLinks},update:{value:socialLinks}});
  return NextResponse.redirect(new URL('/admin/studio-settings?saved=1',publicBase(req)),303);
}
