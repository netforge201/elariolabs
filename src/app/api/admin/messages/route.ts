import {NextResponse} from 'next/server';
import {z} from 'zod';
import {currentAdmin,sameOrigin,publicBase} from '@/lib/auth';
import {requirePermission} from '@/lib/permissions';
import {db} from '@/lib/db';

const schema=z.object({id:z.string().uuid(),status:z.enum(['NEW','READ','REPLIED','ARCHIVED'])});

export async function POST(req:Request){
  if(!await sameOrigin(req))return new Response('Forbidden',{status:403});
  const user=await currentAdmin();
  if(!user)return NextResponse.redirect(new URL('/admin/login',publicBase(req)),303);
  if(!await requirePermission('inquiries.manage'))return new Response('Forbidden',{status:403});
  const parsed=schema.safeParse(Object.fromEntries(await req.formData()));
  if(parsed.success)await db.contactMessage.update({where:{id:parsed.data.id},data:{status:parsed.data.status}});
  return NextResponse.redirect(new URL('/admin/inquiries-messages',publicBase(req)),303)
}
