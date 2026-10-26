import {NextResponse} from 'next/server';
import {currentAdmin,sameOrigin,publicBase} from '@/lib/auth';
import {requirePermission} from '@/lib/permissions';
import {db} from '@/lib/db';

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
  if(!await sameOrigin(req))return new Response('Forbidden',{status:403});
  const user=await currentAdmin();
  if(!user)return NextResponse.redirect(new URL('/admin/login',publicBase(req)),303);
  if(!await requirePermission('support.manage'))return new Response('Forbidden',{status:403});
  const {id}=await params;
  const form=await req.formData();
  const kind=form.get('kind');
  if(kind==='article'){
    const item=await db.helpArticle.findUnique({where:{id},select:{status:true}});
    if(item)await db.helpArticle.update({where:{id},data:{status:item.status==='PUBLISHED'?'DRAFT':'PUBLISHED'}})
  }else if(kind==='faq'){
    const item=await db.fAQ.findUnique({where:{id},select:{status:true}});
    if(item)await db.fAQ.update({where:{id},data:{status:item.status==='PUBLISHED'?'DRAFT':'PUBLISHED'}})
  }
  await db.auditLog.create({data:{actorId:user.id,action:'toggle_publish',entity:String(kind||'support'),entityId:id}});
  return NextResponse.redirect(new URL('/admin/support-knowledgebase',publicBase(req)),303)
}
