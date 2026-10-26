import { currentAdmin } from '@/lib/auth';
import { hasPermission, type Permission } from '@/lib/permissions';

const navigation = [
  { label: 'Dashboard', href: '/admin', permission: null },
  { label: 'Analytics', href: '/admin/analytics', permission: 'analytics.view' },
  { label: 'Applications', href: '/admin/applications', permission: 'applications.view' },
  { label: 'Media Library', href: '/admin/media-library', permission: 'media.manage' },
  { label: 'Legal & Compliance', href: '/admin/legal-compliance', permission: 'legal.manage' },
  { label: 'Inquiries & Messages', href: '/admin/inquiries-messages', permission: 'inquiries.manage' },
  { label: 'Studio Team & Roles', href: '/admin/studio-team-roles', permission: 'users.manage' },
  { label: 'Studio Settings', href: '/admin/studio-settings', permission: 'settings.manage' },
  { label: 'SEO & Metadata', href: '/admin/seo-metadata', permission: 'settings.manage' },
] as const;

export async function getAdminNavigation() {
  const admin = await currentAdmin();
  if (!admin) return [];
  const allowed = [];
  for (const item of navigation) {
    if (item.permission === null || await hasPermission(item.permission as Permission)) {
      if ((item.label === 'Studio Settings' || item.label === 'SEO & Metadata') &&
          !await hasPermission('navigation.manage')) continue;
      allowed.push(item);
    }
  }
  return allowed;
}
