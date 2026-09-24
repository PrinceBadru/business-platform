export type Role = 'owner' | 'admin' | 'manager' | 'employee';

export type Permission = 
  | 'locations:read' | 'locations:write'
  | 'users:read' | 'users:manage'
  | 'offerings:read' | 'offerings:write'
  | 'transactions:read' | 'transactions:write'
  | 'billing:manage' | 'account:delete'
  | '*';

export const rolePermissions: Record<Role, Permission[]> = {
  owner: ['*'],
  admin: [
    'locations:read', 'locations:write', 
    'users:read', 'users:manage',
    'offerings:read', 'offerings:write',
    'transactions:read', 'transactions:write'
  ],
  manager: [
    'locations:read', 
    'users:read',
    'offerings:read', 'offerings:write',
    'transactions:read', 'transactions:write'
  ],
  employee: [
    'locations:read',
    'offerings:read',
    'transactions:read', 'transactions:write'
  ]
};

/**
 * Validates whether a specific role contains a required permission.
 * Accounts for wildcard '*' overrides.
 */
export function hasPermission(role: Role, requiredPermission: Permission): boolean {
  const perms = rolePermissions[role] || [];
  if (perms.includes('*')) return true;
  return perms.includes(requiredPermission);
}
