import { describe, it, expect } from 'vitest';
import { hasPermission } from '../modules/rbac/permissions';

describe('Username Validation Rules', () => {
  const VALID = /^[a-z0-9_]{3,50}$/;

  const validNames = ['abc', 'john_doe', 'user123', 'a_b_c', 'z'.repeat(50)];
  const invalidNames = [
    '',            // empty
    'ab',          // too short
    'z'.repeat(51),// too long
    'John',        // uppercase
    'user-name',   // hyphen not allowed
    'user name',   // space not allowed
    'user@email',  // @ not allowed
    '123 abc',     // space
  ];

  it.each(validNames)('accepts valid username "%s"', (name) => {
    expect(VALID.test(name)).toBe(true);
  });

  it.each(invalidNames)('rejects invalid username "%s"', (name) => {
    expect(VALID.test(name)).toBe(false);
  });
});

describe('Sign-in identifier routing', () => {
  // Pure logic: if identifier contains '@' → email lookup, else username lookup.
  const isEmail = (identifier: string) => identifier.includes('@');

  it('routes email identifiers to email lookup', () => {
    expect(isEmail('user@example.com')).toBe(true);
    expect(isEmail('admin@acmeretail.com')).toBe(true);
  });

  it('routes non-@ identifiers to username lookup', () => {
    expect(isEmail('acme_admin')).toBe(false);
    expect(isEmail('john_doe')).toBe(false);
    expect(isEmail('user123')).toBe(false);
  });
});

describe('RBAC Permissions', () => {
  it('owner wildcard grants every permission', () => {
    const perms = [
      'locations:read', 'locations:write',
      'users:read', 'users:manage',
      'offerings:read', 'offerings:write',
      'transactions:read', 'transactions:write',
      'billing:manage', 'account:delete', '*',
    ] as const;
    perms.forEach(p => expect(hasPermission('owner', p)).toBe(true));
  });

  it('admin can manage users and offerings but cannot delete account or manage billing', () => {
    expect(hasPermission('admin', 'users:manage')).toBe(true);
    expect(hasPermission('admin', 'offerings:write')).toBe(true);
    expect(hasPermission('admin', 'account:delete')).toBe(false);
    expect(hasPermission('admin', 'billing:manage')).toBe(false);
  });

  it('manager can write offerings but cannot manage users', () => {
    expect(hasPermission('manager', 'offerings:write')).toBe(true);
    expect(hasPermission('manager', 'transactions:write')).toBe(true);
    expect(hasPermission('manager', 'users:manage')).toBe(false);
  });

  it('employee can write transactions but cannot manage offerings or users', () => {
    expect(hasPermission('employee', 'transactions:write')).toBe(true);
    expect(hasPermission('employee', 'locations:read')).toBe(true);
    expect(hasPermission('employee', 'offerings:write')).toBe(false);
    expect(hasPermission('employee', 'users:read')).toBe(false);
    expect(hasPermission('employee', 'account:delete')).toBe(false);
    expect(hasPermission('employee', 'billing:manage')).toBe(false);
  });
});
