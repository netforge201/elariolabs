import {NextResponse} from 'next/server';
import {z} from 'zod';
import {currentAdmin,sameOrigin,publicBase} from '@/lib/auth';
import {requirePermission} from '@/lib/permissions';
import {db} from '@/lib/db';

const schema=z.object({
  title:z.string().trim().min(1).max(180),
  slug:z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180),
  type:z.string().trim().min(1).max(80),
  content:z.string().trim().min(1).max(50000),
  effectiveDate:z.string().optional(),
  applicationId:z.string().uuid().optional().or(z.literal(''))
});

export async function POST(req:Request){
  if(!await sameOrigin(req))return new Response('Forbidden',{status:403});
  const user=await currentAdmin();
  if(!user)return NextResponse.redirect(new URL('/admin/login',publicBase(req)),303);
  if(!await requirePermission('legal.manage'))return new Response('Forbidden',{status:403});
  const form=await req.formData();
  const parsed=schema.safeParse(Object.fromEntries(form));
  if(!parsed.success)return NextResponse.redirect(new URL('/admin/legal-compliance?error=invalid',publicBase(req)),303);
  const d=parsed.data;
  try{
    const doc=await db.legalDocument.create({data:{title:d.title,slug:d.slug,type:d.type,content:d.content,applicationId:d.applicationId||null,effectiveDate:d.effectiveDate?new Date(d.effectiveDate):null,status:'DRAFT'}});
    await db.auditLog.create({data:{actorId:user.id,action:'create',entity:'legal_document',entityId:doc.id,summary:{title:doc.title,slug:doc.slug}}});
    return NextResponse.redirect(new URL('/admin/legal-compliance?saved=1',publicBase(req)),303);
  }catch(error){
    const duplicate=typeof error==='object'&&error!==null&&'code'in error&&(error as {code?:string}).code==='P2002';
    return NextResponse.redirect(new URL(`/admin/legal-compliance?error=${duplicate?'duplicate':'save'}`,publicBase(req)),303);
  }
}
