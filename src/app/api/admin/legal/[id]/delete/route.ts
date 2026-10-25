import {NextResponse} from 'next/server';
import {currentAdmin,sameOrigin} from '@/lib/auth';
import {db} from '@/lib/db';

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
  if(!await sameOrigin(req))return new Response('Forbidden',{status:403});
  const user=await currentAdmin();
  if(!user)return NextResponse.redirect(new URL('/admin/login',req.url),303);
  const {id}=await params;
  const document=await db.legalDocument.findUnique({where:{id},select:{id:true,title:true,slug:true,status:true}});
  if(!document)return NextResponse.redirect(new URL('/admin/legal-compliance?error=missing',req.url),303);
  await db.legalDocument.delete({where:{id}});
  await db.auditLog.create({data:{actorId:user.id,action:'delete',entity:'legal_document',entityId:id,summary:{title:document.title,slug:document.slug,status:document.status}}});
  return NextResponse.redirect(new URL('/admin/legal-compliance?deleted=1',req.url),303);
}
