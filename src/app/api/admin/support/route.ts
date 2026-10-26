import {NextResponse} from 'next/server';
import {z} from 'zod';
import {currentAdmin,sameOrigin,publicBase} from '@/lib/auth';
import {requirePermission} from '@/lib/permissions';
import {db} from '@/lib/db';

const schema=z.object({kind:z.enum(['article','faq']),title:z.string().max(180).optional(),slug:z.string().max(180).optional(),excerpt:z.string().max(500).optional(),content:z.string().max(20000).optional(),categoryId:z.string().uuid().optional().or(z.literal('')),question:z.string().max(500).optional(),answer:z.string().max(10000).optional()});

export async function POST(req:Request){
  if(!await sameOrigin(req))return new Response('Forbidden',{status:403});
  const user=await currentAdmin();
  if(!user)return NextResponse.redirect(new URL('/admin/login',publicBase(req)),303);
  if(!await requirePermission('support.manage'))return new Response('Forbidden',{status:403});
  const parsed=schema.safeParse(Object.fromEntries(await req.formData()));
  if(parsed.success){
    const d=parsed.data;
    if(d.kind==='article'&&d.title&&d.slug&&d.content)await db.helpArticle.create({data:{title:d.title,slug:d.slug,excerpt:d.excerpt??'',content:d.content,categoryId:d.categoryId||null,status:'DRAFT'}});
    if(d.kind==='faq'&&d.question&&d.answer)await db.fAQ.create({data:{question:d.question,answer:d.answer,status:'DRAFT'}});
  }
  return NextResponse.redirect(new URL('/admin/support-knowledgebase',publicBase(req)),303)
}
