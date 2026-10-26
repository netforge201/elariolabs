import { currentAdmin } from '@/lib/auth';

export type Permission =
  | 'applications.view'
  | 'applications.manage'
  | 'content.manage'
  | 'navigation.manage'
  | 'settings.manage'
  | 'inquiries.manage'
  | 'support.manage'
  | 'media.manage'
  | 'releases.manage'
  | 'legal.manage'
  | 'analytics.view'
  | 'users.manage';

export async function hasPermission(
  permission: Permission,
): Promise<boolean> {
  const admin = await currentAdmin();

  if (!admin) return false;

  // Super Admin always has full access.
  if (admin.role.name === 'Super Admin') return true;

  const permissions: unknown = admin.role.permissions;

  // Explicit database permissions take precedence.
  if (Array.isArray(permissions)) {
    if (permissions.includes('*')) return false;
    return permissions.includes(permission);
  }

  // Unknown or malformed permissions fail closed.
  return false;
}

export async function requirePermission(
  permission: Permission,
): Promise<boolean> {
  return hasPermission(permission);
}
