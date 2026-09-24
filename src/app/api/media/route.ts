import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const assets = await prisma.mediaAsset.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(assets);
}
