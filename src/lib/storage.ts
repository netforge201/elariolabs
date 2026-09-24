import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs/promises';
export interface UploadResult { url: string; filename: string; size: number; mimeType: string; }
export async function uploadFile(file: File): Promise<UploadResult> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = path.extname(file.name).toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  if (!allowedExts.includes(ext)) { throw new Error('File type not allowed'); }
  const filename = `${randomUUID()}${ext}`;
  const provider = process.env.STORAGE_PROVIDER || 'local';
  if (provider === 'local') {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    const filepath = path.join(uploadDir, filename);
    await fs.writeFile(filepath, buffer);
    return { url: `/uploads/${filename}`, filename, size: file.size, mimeType: file.type };
  } else if (provider === 's3') {
    throw new Error('S3 upload not fully implemented in this iteration.');
  }
  throw new Error('Unknown storage provider');
}
export async function deleteFile(filename: string) {
  const provider = process.env.STORAGE_PROVIDER || 'local';
  if (provider === 'local') {
    try { const filepath = path.join(process.cwd(), 'public', 'uploads', filename); await fs.unlink(filepath); } catch (e) { }
  }
}
