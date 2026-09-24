import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { uploadFile } from '@/lib/storage';
import { getSession } from '@/lib/session';
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) { return NextResponse.json({ error: 'No file provided' }, { status: 400 }); }
    const result = await uploadFile(file);
    const mediaAsset = await prisma.mediaAsset.create({ data: { filename: result.filename, originalName: file.name, mimeType: result.mimeType, size: result.size, url: result.url, }, });
    return NextResponse.json(mediaAsset);
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
