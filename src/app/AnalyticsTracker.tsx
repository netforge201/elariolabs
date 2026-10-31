'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

function getId(key: string, storage: Storage): string {
  let id = storage.getItem(key);

  if (!id) {
    id = crypto.randomUUID();
    storage.setItem(key, id);
  }

  return id;
}

export default function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return;

    try {
      const visitorId = getId('elario_visitor_id', localStorage);
      const sessionId = getId('elario_session_id', sessionStorage);

      const params = new URLSearchParams(window.location.search);
      const referrer = document.referrer || null;

      const referrerHost = referrer
        ? new URL(referrer).hostname
        : null;

      const source =
        params.get('utm_source') ||
        (referrerHost && !referrerHost.includes(window.location.hostname)
          ? referrerHost
          : 'direct');

      const payload = {
        event: 'page_view',
        path: pathname,
        visitorId,
        sessionId,
        referrer,
        source,
        medium: params.get('utm_medium'),
        campaign: params.get('utm_campaign'),
      };

      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // Analytics must never interrupt the visitor experience.
    }
  }, [pathname]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const link = target?.closest('a');

      if (!link?.href || !/apps\.apple\.com/i.test(link.href)) return;

      try {
        const visitorId = getId('elario_visitor_id', localStorage);
        const sessionId = getId('elario_session_id', sessionStorage);

        fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'app_store_click',
            path: window.location.pathname,
            visitorId,
            sessionId,
            referrer: document.referrer || null,
          }),
          keepalive: true,
        }).catch(() => {});
      } catch {
        // Ignore tracking errors.
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return null;
}
