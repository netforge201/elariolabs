import {NextResponse} from 'next/server';
import {randomUUID} from 'node:crypto';
import {basename,extname} from 'node:path';
import {currentAdmin,sameOrigin,publicBase} from '@/lib/auth';
import {db} from '@/lib/db';
import {mediaStorage} from '@/lib/storage';

export const runtime='nodejs';
const signatures:[string,number[]][]=[['image/png',[137,80,78,71,13,10,26,10]],['image/jpeg',[255,216,255]],['image/webp',[82,73,70,70]],['image/gif',[71,73,70,56]]];

export async function POST(req:Request){
 if(!await sameOrigin(req))return new Response('Forbidden',{status:403});
 const user=await currentAdmin();
 if(!user)return NextResponse.redirect(new URL('/admin/login',publicBase(req)),303);
 const form=await req.formData();
 const file=form.get('file');
 const altText=String(form.get('altText')||'').slice(0,300);

 if(file instanceof File&&file.size){
  if(file.size>8*1024*1024)return NextResponse.redirect(new URL('/admin/media-library?error=file',publicBase(req)),303);
  const bytes=Buffer.from(await file.arrayBuffer());
  const hit=signatures.find(([mime,sig])=>mime==='image/webp'?bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP':sig.every((b,i)=>bytes[i]===b));
  if(!hit)return NextResponse.redirect(new URL('/admin/media-library?error=type',publicBase(req)),303);
  const mime=hit[0],ext=mime.split('/')[1].replace('jpeg','jpg');
  const {key,url,deleteUrl}=await mediaStorage().put(bytes,mime,ext);
  await db.mediaAsset.create({data:{storageKey:key,deleteUrl,originalFilename:file.name.slice(0,240),storedName:`${randomUUID()}.${ext}`,mimeType:mime,size:file.size,altText,uploadedBy:user.id}});
  await db.auditLog.create({data:{actorId:user.id,action:'upload',entity:'media_asset',entityId:key,summary:{mime,size:file.size}}});
  return NextResponse.redirect(new URL('/admin/media-library?uploaded=1',publicBase(req)),303);
 }

 const suppliedUrl=String(form.get('imageUrl')||'').trim();
 let imageUrl:URL;
 try{imageUrl=new URL(suppliedUrl)}catch{return NextResponse.redirect(new URL('/admin/media-library?error=url',publicBase(req)),303)}
 const ext=extname(imageUrl.pathname).slice(1).toLowerCase();
 const mimeByExt:Record<string,string>={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif'};
 if(imageUrl.protocol!=='https:'||imageUrl.hostname!=='i.ibb.co'||!mimeByExt[ext]||imageUrl.username||imageUrl.password)return NextResponse.redirect(new URL('/admin/media-library?error=url',publicBase(req)),303);
 const key=imageUrl.toString();
 const existing=await db.mediaAsset.findUnique({where:{storageKey:key},select:{id:true}});
 if(existing)return NextResponse.redirect(new URL('/admin/media-library?uploaded=1',publicBase(req)),303);
 const filename=basename(imageUrl.pathname).slice(0,240)||`imgbb-image.${ext}`;
 await db.mediaAsset.create({data:{storageKey:key,originalFilename:filename,storedName:`${randomUUID()}.${ext}`,mimeType:mimeByExt[ext],size:0,altText,uploadedBy:user.id}});
 await db.auditLog.create({data:{actorId:user.id,action:'import',entity:'media_asset',entityId:key,summary:{provider:'imgbb',filename}}});
 return NextResponse.redirect(new URL('/admin/media-library?uploaded=1',publicBase(req)),303);
}
