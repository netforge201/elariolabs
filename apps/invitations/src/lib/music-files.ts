import { db } from '@/lib/db';

/**
 * Identifies an audio file from its first bytes. The browser-supplied MIME type
 * and file extension are never trusted. Returns null for anything that is not
 * one of the supported audio containers.
 */
export function sniffAudio(bytes: Uint8Array): string | null {
  if (bytes.length < 12) return null;
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.subarray(start, end));

  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WAVE') return 'audio/wav';
  if (ascii(0, 4) === 'OggS') return 'audio/ogg';
  if (ascii(0, 4) === 'fLaC') return 'audio/flac';
  if (ascii(4, 8) === 'ftyp') return 'audio/mp4'; // .m4a / .mp4 / .aac in MP4
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) return 'audio/webm';
  if (ascii(0, 3) === 'ID3') return 'audio/mpeg';
  if (bytes[0] === 0xff) {
    // ADTS AAC: 1111 1111 1111 x00x (layer bits are 00)
    if ((bytes[1] & 0xf6) === 0xf0) return 'audio/aac';
    // MPEG audio frame sync: 11 set bits, layer bits not 00
    if ((bytes[1] & 0xe0) === 0xe0 && (bytes[1] & 0x06) !== 0) return 'audio/mpeg';
  }
  return null;
}

export function cleanFilename(name: string) {
  const base = name.split(/[\\/]/).pop() ?? '';
  const cleaned = base.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 200);
  return cleaned || 'audio';
}

/** The upload currently saved on the account's invitation, if any. */
export async function savedUploadId(accountId: string): Promise<string | null> {
  const wedding = await db.invitationWedding.findUnique({ where: { accountId }, select: { theme: true } });
  const theme = wedding?.theme && typeof wedding.theme === 'object' && !Array.isArray(wedding.theme)
    ? wedding.theme as Record<string, unknown>
    : {};
  const upload = theme.musicUpload as { id?: unknown } | undefined;
  return typeof upload?.id === 'string' ? upload.id : null;
}

/** Replaced or removed uploads are kept this long before they are deleted. */
const SPARE_GRACE_MS = 3 * 24 * 60 * 60 * 1000;
/** …and at most this many of them per account (newest first). */
const MAX_SPARE_FILES = 3;

/**
 * Deletes the account's uploads that nothing refers to any more. `keep` lists
 * the ids in use (the saved one and/or one waiting to be saved).
 *
 * Unreferenced files are not deleted straight away: an editor open in another
 * tab, or restored with the browser's Back button, may still point at the
 * previous file and must be able to save it. They are removed once they are
 * older than the grace period, or when more than a few have piled up, so each
 * account stores at most 1 + MAX_SPARE_FILES files.
 */
export async function pruneMusicFiles(accountId: string, keep: (string | null | undefined)[]) {
  const ids = keep.filter((id): id is string => Boolean(id));
  const spare = await db.invitationMusicFile.findMany({
    where: { accountId, ...(ids.length ? { id: { notIn: ids } } : {}) },
    select: { id: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  const cutoff = Date.now() - SPARE_GRACE_MS;
  const expired = spare
    .filter((file, index) => index >= MAX_SPARE_FILES || file.createdAt.getTime() < cutoff)
    .map(file => file.id);
  if (expired.length) await db.invitationMusicFile.deleteMany({ where: { accountId, id: { in: expired } } });
}
