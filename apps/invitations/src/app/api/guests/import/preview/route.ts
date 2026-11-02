import { NextRequest, NextResponse } from 'next/server';
import { currentInvitationAccount } from '@/lib/auth';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');

  if (!origin || !host) return false;

  try {
    const parsed = new URL(origin);
    return parsed.host === host && ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function cleanName(value: string) {
  return value
    .replace(/^\uFEFF/, '')
    .replace(/^[\s•*·▪◦\-–—]+/, '')
    .replace(/^\d+[\s.)、-]+/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
}

function uniqueNames(values: string[]) {
  const seen = new Set<string>();
  const names: string[] = [];

  for (const value of values) {
    const name = cleanName(value);
    const key = name.normalize('NFKC').toLocaleLowerCase();

    if (!name || !key || seen.has(key)) continue;

    seen.add(key);
    names.push(name);
  }

  return names;
}

function extractSpreadsheet(buffer: Buffer) {
  const workbook = XLSX.read(buffer, {
    type: 'buffer',
    cellDates: false,
  });

  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

  if (!firstSheet) return [];

  const rows = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, {
    header: 1,
    defval: '',
    raw: false,
  });

  const values = rows
    .map(row => Array.isArray(row) ? String(row[0] ?? '') : '')
    .filter(Boolean);

  if (values.length && /^(name|guest|guest name|full name|имя|фио|ad soyad|qonaq|ad)$/i.test(values[0].trim())) {
    values.shift();
  }

  return values;
}

function extractTextLines(text: string) {
  return text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map(cleanName)
    .filter(Boolean);
}

async function extractPdf(buffer: Buffer) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

  const document = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
  }).promise;

  const lines: string[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();

      const fragments = content.items
        .filter((item): item is typeof item & { str: string; transform: number[] } =>
          'str' in item && 'transform' in item
        )
        .map(item => ({
          text: item.str,
          x: item.transform[4],
          y: item.transform[5],
        }))
        .filter(item => item.text.trim());

      const pageLines: { y: number; fragments: typeof fragments }[] = [];

      for (const fragment of fragments) {
        let line = pageLines.find(item => Math.abs(item.y - fragment.y) < 3);

        if (!line) {
          line = { y: fragment.y, fragments: [] };
          pageLines.push(line);
        }

        line.fragments.push(fragment);
      }

      pageLines.sort((a, b) => b.y - a.y);

      for (const line of pageLines) {
        line.fragments.sort((a, b) => a.x - b.x);
        lines.push(line.fragments.map(item => item.text).join(' '));
      }

      page.cleanup();
    }
  } finally {
    await (document as unknown as { destroy: () => Promise<void> }).destroy();
  }

  return lines;
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }

  const account = await currentInvitationAccount();

  if (!account) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const wedding = await import('@/lib/db').then(({ db }) =>
    db.invitationWedding.findUnique({
      where: { accountId: account.id },
      select: { id: true },
    })
  );

  if (!wedding) {
    return NextResponse.json(
      { error: 'Create and save the wedding first.' },
      { status: 400 },
    );
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Could not read uploaded file.' }, { status: 400 });
  }

  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Select a file.' }, { status: 400 });
  }

  if (file.size === 0) {
    return NextResponse.json({ error: 'The file is empty.' }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'Maximum file size is 10 MB.' }, { status: 413 });
  }

  const extension = file.name.split('.').pop()?.toLowerCase();

  if (!extension || !['csv', 'xlsx', 'xls', 'docx', 'txt', 'pdf'].includes(extension)) {
    return NextResponse.json(
      { error: 'Supported formats: CSV, XLSX, XLS, DOCX, TXT and PDF. Old DOC files are not supported.' },
      { status: 400 },
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    let extracted: string[];

    if (extension === 'csv' || extension === 'xlsx' || extension === 'xls') {
      extracted = extractSpreadsheet(buffer);
    } else if (extension === 'docx') {
      const result = await mammoth.extractRawText({ buffer });
      extracted = extractTextLines(result.value);
    } else if (extension === 'txt') {
      extracted = extractTextLines(
        new TextDecoder('utf-8').decode(buffer),
      );
    } else {
      extracted = await extractPdf(buffer);
    }

    const names = uniqueNames(extracted);

    if (!names.length) {
      return NextResponse.json(
        {
          error: extension === 'pdf'
            ? 'No text found in this PDF. It may be a scanned document and require OCR.'
            : 'No guest names could be extracted from this file.',
        },
        { status: 422 },
      );
    }

    return NextResponse.json({
      fileName: file.name,
      names,
      count: names.length,
      warnings: extension === 'pdf'
        ? ['Check the extracted names carefully. PDF text layout can affect line separation.']
        : [],
    });
  } catch (error) {
    console.error('Guest import preview failed:', error);

    return NextResponse.json(
      { error: 'Could not parse this file. Check its format and contents.' },
      { status: 422 },
    );
  }
}
