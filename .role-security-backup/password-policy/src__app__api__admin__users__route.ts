import {NextResponse} from 'next/server';
import {z} from 'zod';
import bcrypt from 'bcryptjs';
import {currentAdmin,sameOrigin,publicBase} from '@/lib/auth';
import {requirePermission} from '@/lib/permissions';
import {db} from '@/lib/db';

const schema=z.object({name:z.string().min(1).max(120),email:z.string().email().max(254),password:z.string().min(14).max(200),roleId:z.string().uuid()});

export async function POST(req:Request){
  if(!await sameOrigin(req))return new Response('Forbidden',{status:403});
  const actor=await currentAdmin();
  if(!actor)return NextResponse.redirect(new URL('/admin/login',publicBase(req)),303);
  if(!await requirePermission('users.manage'))return new Response('Forbidden',{status:403});
  const parsed=schema.safeParse(Object.fromEntries(await req.formData()));
  if(parsed.success)await db.adminUser.create({data:{name:parsed.data.name,email:parsed.data.email.toLowerCase(),passwordHash:await bcrypt.hash(parsed.data.password,12),roleId:parsed.data.roleId}});
  return NextResponse.redirect(new URL('/admin/studio-team-roles',publicBase(req)),303)
}


export async function DELETE(req: Request) {
  if (!await sameOrigin(req)) {
    return new Response('Forbidden', { status: 403 });
  }

  const actor = await currentAdmin();
  if (!actor) {
    return new Response('Unauthorized', { status: 401 });
  }

  // User management and deletion are restricted to Super Admin.
  if (actor.role.name !== 'Super Admin') {
    return new Response('Forbidden', { status: 403 });
  }

  let body: { id?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  if (typeof body.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.id)) {
    return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
  }

  if (body.id === actor.id) {
    return NextResponse.json(
      { error: 'You cannot delete your own account.' },
      { status: 400 }
    );
  }

  const target = await db.adminUser.findUnique({
    where: { id: body.id },
    include: { role: true },
  });

  if (!target) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (target.role.name === 'Super Admin') {
    const count = await db.adminUser.count({
      where: { active: true, role: { name: 'Super Admin' } },
    });

    if (count <= 1) {
      return NextResponse.json(
        { error: 'Cannot delete the last active Super Admin.' },
        { status: 400 }
      );
    }
  }

  await db.adminUser.delete({ where: { id: target.id } });

  return NextResponse.json({ success: true });
}
