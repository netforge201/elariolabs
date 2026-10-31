import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { currentAdmin } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { getAdminNavigation } from '@/lib/admin-navigation';
import { AdminShell } from '../../components';

export const dynamic = 'force-dynamic';

const period = 30;
const since = new Date(Date.now() - period * 86400000);

function formatNumber(value: number) {
  return value.toLocaleString('en-US');
}

function percentage(value: number, total: number) {
  if (!total) return '0%';
  return `${((value / total) * 100).toFixed(1)}%`;
}

function BarList({
  title,
  items,
}: {
  title: string;
  items: { label: string; count: number }[];
}) {
  const max = Math.max(...items.map((item) => item.count), 1);

  return (
    <section className="card" style={{ marginBottom: '1rem' }}>
      <h2>{title}</h2>
      {items.length ? (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {items.map((item) => (
            <div key={item.label}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  marginBottom: '.4rem',
                  fontSize: '.9rem',
                }}
              >
                <span style={{ overflowWrap: 'anywhere' }}>{item.label || 'Unknown'}</span>
                <strong>{formatNumber(item.count)}</strong>
              </div>
              <div
                style={{
                  height: 7,
                  background: 'var(--line, #e8eaf0)',
                  borderRadius: 20,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${(item.count / max) * 100}%`,
                    background: 'var(--accent, #6558e8)',
                    borderRadius: 20,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mono">No data available yet.</p>
      )}
    </section>
  );
}

export default async function Analytics() {
  const user = await currentAdmin();

  if (!user) redirect('/admin/login');
  if (user.mustChangePassword) redirect('/admin/change-password');
  if (!await requirePermission('analytics.view')) {
    redirect('/admin?forbidden=1');
  }

  const allowedLinks = await getAdminNavigation();

  const where = {
    createdAt: { gte: since },
  };

  const pageViewsWhere = {
    ...where,
    event: 'page_view',
  };

  const [
    totalViews,
    visitors,
    sessions,
    conversions,
    pages,
    sources,
    devices,
    browsers,
    countries,
    recent,
    previousViews,
  ] = await Promise.all([
    db.analyticsEvent.count({
      where: pageViewsWhere,
    }),

    db.analyticsEvent.groupBy({
      by: ['visitorId'],
      where: {
        ...pageViewsWhere,
        visitorId: { not: null },
      },
    }),

    db.analyticsEvent.groupBy({
      by: ['sessionId'],
      where: {
        ...pageViewsWhere,
        sessionId: { not: null },
      },
    }),

    db.analyticsEvent.count({
      where: {
        ...where,
        event: 'app_store_click',
      },
    }),

    db.analyticsEvent.groupBy({
      by: ['path'],
      where: pageViewsWhere,
      _count: { _all: true },
      orderBy: { _count: { path: 'desc' } },
      take: 10,
    }),

    db.analyticsEvent.groupBy({
      by: ['source'],
      where: pageViewsWhere,
      _count: { _all: true },
      orderBy: { _count: { source: 'desc' } },
      take: 10,
    }),

    db.analyticsEvent.groupBy({
      by: ['device'],
      where: pageViewsWhere,
      _count: { _all: true },
      orderBy: { _count: { device: 'desc' } },
      take: 10,
    }),

    db.analyticsEvent.groupBy({
      by: ['browser'],
      where: pageViewsWhere,
      _count: { _all: true },
      orderBy: { _count: { browser: 'desc' } },
      take: 10,
    }),

    db.analyticsEvent.groupBy({
      by: ['country'],
      where: pageViewsWhere,
      _count: { _all: true },
      orderBy: { _count: { country: 'desc' } },
      take: 10,
    }),

    db.analyticsEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 15,
      select: {
        event: true,
        path: true,
        source: true,
        device: true,
        country: true,
        createdAt: true,
      },
    }),

    db.analyticsEvent.count({
      where: {
        event: 'page_view',
        createdAt: {
          gte: new Date(Date.now() - 60 * 86400000),
          lt: since,
        },
      },
    }),
  ]);

  const sourceItems = sources.map((item) => ({
    label: item.source || 'Unknown / Direct',
    count: item._count._all,
  }));

  const deviceItems = devices.map((item) => ({
    label: item.device || 'Unknown',
    count: item._count._all,
  }));

  const browserItems = browsers.map((item) => ({
    label: item.browser || 'Unknown',
    count: item._count._all,
  }));

  const countryItems = countries.map((item) => ({
    label: item.country || 'Unknown',
    count: item._count._all,
  }));

  const pageItems = pages.map((item) => ({
    label: item.path,
    count: item._count._all,
  }));

  const growth = previousViews
    ? ((totalViews - previousViews) / previousViews) * 100
    : null;

  return (
    <AdminShell active="Analytics" allowedLinks={allowedLinks}>
      <div className="admin-title">
        <div>
          <div className="eyebrow">Overview / Insights</div>
          <h1>Website Analytics</h1>
          <p>Website traffic and visitor insights for the last 30 days.</p>
        </div>
      </div>

      <div className="metrics">
        <div className="metric">
          <span className="eyebrow">Page views</span>
          <strong>{formatNumber(totalViews)}</strong>
          <span className="mono">
            {growth === null
              ? 'No previous period data'
              : `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}% vs previous 30 days`}
          </span>
        </div>

        <div className="metric">
          <span className="eyebrow">Unique visitors</span>
          <strong>{formatNumber(visitors.length)}</strong>
        </div>

        <div className="metric">
          <span className="eyebrow">Sessions</span>
          <strong>{formatNumber(sessions.length)}</strong>
        </div>

        <div className="metric">
          <span className="eyebrow">App Store clicks</span>
          <strong>{formatNumber(conversions)}</strong>
        </div>
      </div>

      <div className="metrics">
        <div className="metric">
          <span className="eyebrow">Pages tracked</span>
          <strong>{pages.length}</strong>
        </div>

        <div className="metric">
          <span className="eyebrow">Average views / session</span>
          <strong>
            {sessions.length
              ? (totalViews / sessions.length).toFixed(2)
              : '0.00'}
          </strong>
        </div>

        <div className="metric">
          <span className="eyebrow">App Store click rate</span>
          <strong>{percentage(conversions, totalViews)}</strong>
        </div>

        <div className="metric">
          <span className="eyebrow">Reporting period</span>
          <strong>30 days</strong>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
          gap: '1rem',
          alignItems: 'start',
        }}
      >
        <BarList title="Popular pages" items={pageItems} />
        <BarList title="Traffic sources" items={sourceItems} />
        <BarList title="Devices" items={deviceItems} />
        <BarList title="Browsers" items={browserItems} />
        <BarList title="Countries" items={countryItems} />
      </div>

      <section className="card">
        <h2>Recent activity</h2>
        {recent.length ? (
          <div className="tablewrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Page</th>
                  <th>Source</th>
                  <th>Device</th>
                  <th>Country</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((event, index) => (
                  <tr key={`${event.path}-${event.createdAt.toISOString()}-${index}`}>
                    <td>{event.event === 'app_store_click' ? 'App Store click' : 'Page view'}</td>
                    <td>{event.path}</td>
                    <td>{event.source || '—'}</td>
                    <td>{event.device || '—'}</td>
                    <td>{event.country || '—'}</td>
                    <td>{event.createdAt.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mono">No recorded events yet.</p>
        )}
      </section>
    </AdminShell>
  );
}
