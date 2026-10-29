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

const roleDefaults: Record<string, Permission[]> = {
  Editor: [
    'applications.view',
    'applications.manage',
    'content.manage',
    'media.manage',
    'releases.manage',
  ],
  Support: [
    'inquiries.manage',
    'support.manage',
  ],
};

export async function hasPermission(permission: Permission): Promise<boolean> {
  const admin = await currentAdmin();

  if (!admin) return false;

  const permissions: unknown = admin.role.permissions;

  if (admin.role.name === 'Super Admin') return true;

  if (!Array.isArray(permissions)) return false;
  if (permissions.includes('*')) return true;
  if (permissions.includes(permission)) return true;

  // Если роль пока не настроена в базе, используем безопасный набор прав по умолчанию.
  const defaults = roleDefaults[admin.role.name] ?? [];
  return defaults.includes(permission);
}

export async function requirePermission(permission: Permission) {
  return hasPermission(permission);
}
