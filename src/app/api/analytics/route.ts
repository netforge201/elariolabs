import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const schema = z.object({
  event: z.enum(['page_view', 'app_store_click']).default('page_view'),
  path: z.string().startsWith('/').max(300),
  visitorId: z.string().uuid().optional(),
  sessionId: z.string().uuid().optional(),
  referrer: z.string().max(1000).optional().nullable(),
  source: z.string().max(150).optional().nullable(),
  medium: z.string().max(150).optional().nullable(),
  campaign: z.string().max(200).optional().nullable(),
});

function getDevice(ua: string) {
  if (/ipad|tablet/i.test(ua)) return 'Tablet';
  if (/mobile|iphone|android/i.test(ua)) return 'Mobile';
  return 'Desktop';
}

function getBrowser(ua: string) {
  if (/edg\//i.test(ua)) return 'Edge';
  if (/opr\//i.test(ua)) return 'Opera';
  if (/firefox\//i.test(ua)) return 'Firefox';
  if (/chrome\//i.test(ua) && !/edg\//i.test(ua)) return 'Chrome';
  if (/safari\//i.test(ua) && !/chrome\//i.test(ua)) return 'Safari';
  return 'Other';
}

function getOS(ua: string) {
  if (/windows/i.test(ua)) return 'Windows';
  if (/macintosh|mac os/i.test(ua)) return 'macOS';
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS';
  if (/android/i.test(ua)) return 'Android';
  if (/linux/i.test(ua)) return 'Linux';
  return 'Other';
}

export async function POST(req: Request) {
  if (process.env.ANALYTICS_ENABLED === 'false') {
    return new NextResponse(null, { status: 204 });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
    }

    const data = parsed.data;
    const path = data.path.split('?')[0];

    if (path.startsWith('/admin') || path.startsWith('/api')) {
      return new NextResponse(null, { status: 204 });
    }

    const ua = req.headers.get('user-agent') || '';
    const country =
      req.headers.get('x-vercel-ip-country') ||
      req.headers.get('cf-ipcountry') ||
      req.headers.get('x-country-code') ||
      null;

    await db.analyticsEvent.create({
      data: {
        event: data.event,
        path,
        visitorId: data.visitorId,
        sessionId: data.sessionId,
        referrer: data.referrer || null,
        source: data.source || null,
        medium: data.medium || null,
        campaign: data.campaign || null,
        country: country && country !== 'XX' ? country : null,
        device: getDevice(ua),
        browser: getBrowser(ua),
        os: getOS(ua),
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Analytics event error:', error);
    return new NextResponse(null, { status: 500 });
  }
}
