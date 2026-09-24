import { describe, it, expect } from 'vitest';
import { hasPermission } from '../modules/rbac/permissions';

describe('RBAC Offline Permissions Evaluation', () => {
  it('Owner should have access to everything via wildcard', () => {
    expect(hasPermission('owner', 'account:delete')).toBe(true);
    expect(hasPermission('owner', 'locations:read')).toBe(true);
    expect(hasPermission('owner', '*')).toBe(true);
  });

  it('Admin should have manage access but not destructive access', () => {
    expect(hasPermission('admin', 'users:manage')).toBe(true);
    expect(hasPermission('admin', 'offerings:write')).toBe(true);
    
    // Admins cannot delete accounts or manage billing
    expect(hasPermission('admin', 'account:delete')).toBe(false);
    expect(hasPermission('admin', 'billing:manage')).toBe(false);
  });

  it('Employee should have read and limited write access', () => {
    expect(hasPermission('employee', 'locations:read')).toBe(true);
    expect(hasPermission('employee', 'transactions:write')).toBe(true);
    
    // Employees cannot manage users or offerings
    expect(hasPermission('employee', 'users:read')).toBe(false);
    expect(hasPermission('employee', 'offerings:write')).toBe(false);
  });
});
