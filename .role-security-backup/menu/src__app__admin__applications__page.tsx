import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { currentAdmin } from '@/lib/auth';
import { requirePermission } from '@/lib/permissions';
import { AdminShell } from '../../components';

export const dynamic = 'force-dynamic';

export default async function ApplicationsAdmin() {
  const user = await currentAdmin();
  if (!user) redirect('/admin/login');
  if (!await requirePermission('applications.view')) redirect('/admin?forbidden=1');
  const apps = await db.application.findMany({
    include: { category: true, platforms: { include: { platform: true } } },
    orderBy: [{ updatedAt: 'desc' }],
  });
  return <AdminShell active="Applications">
    <div className="admin-title">
      <div><div className="eyebrow">Catalog & content</div><h1 style={{fontSize:'2rem'}}>Applications</h1><p>Manage application information and publishing.</p></div>
      <Link className="btn btn-primary" href="/admin/applications/new">Add application</Link>
    </div>
    {!apps.length ? <div className="empty"><h2>No applications yet</h2><p>Create a draft to begin building your catalog.</p><Link className="btn btn-primary" href="/admin/applications/new">Add your first application</Link></div> :
      <form id="bulk" action="/api/admin/applications/bulk" method="post">
        <div className="card" style={{marginBottom:'1rem',display:'flex',gap:'.5rem',alignItems:'center',flexWrap:'wrap'}}>
          <strong>Selected applications</strong>
          <button name="action" value="publish">Publish selected</button>
          <button name="action" value="archive">Return to draft</button>
          <span className="mono">Sitemap updates automatically.</span>
        </div>
        <div className="tablewrap"><table className="table"><thead><tr><th>Select</th><th>Identity</th><th>Platforms</th><th>Availability</th><th>Content state</th><th>Modified</th><th></th></tr></thead>
          <tbody>{apps.map(app=><tr key={app.id}>
            <td><input aria-label={`Select ${app.name}`} type="checkbox" name="ids" value={app.id}/></td>
            <td><Link href={`/admin/applications/${app.id}`}>{app.name}</Link><div className="mono">/{app.slug}{app.category?` · ${app.category.name}`:''}</div></td>
            <td>{app.platforms.map(item=>item.platform.name).join(', ')||'—'}</td>
            <td>{app.availability.replace('_',' ')}</td>
            <td><span className={`badge ${app.contentState==='PUBLISHED'?'badge-live':''}`}>{app.contentState}</span></td>
            <td>{app.updatedAt.toLocaleDateString()}</td><td><Link href={`/admin/applications/${app.id}`}>Edit</Link></td>
          </tr>)}</tbody>
        </table></div>
      </form>
    }
  </AdminShell>;
}
