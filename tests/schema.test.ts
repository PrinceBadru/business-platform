import { describe, it, expect } from 'vitest';
import * as schema from '../lib/db/schema';

describe('Database Schema', () => {
  it('should define core multitenant tables', () => {
    // Assert presence of all tables required for Day 6
    expect(schema.accounts).toBeDefined();
    expect(schema.locations).toBeDefined();
    expect(schema.users).toBeDefined();
    expect(schema.userAccountRoles).toBeDefined();
    expect(schema.userLocationAccess).toBeDefined();
    expect(schema.webauthnCredentials).toBeDefined();
    expect(schema.suppliers).toBeDefined();
    expect(schema.offerings).toBeDefined();
    expect(schema.transactions).toBeDefined();
    expect(schema.transactionLines).toBeDefined();
    expect(schema.customers).toBeDefined();
    expect(schema.debts).toBeDefined();
    expect(schema.debtPayments).toBeDefined();
    expect(schema.jobs).toBeDefined();
    expect(schema.dailySummaries).toBeDefined();
  });

  it('should define required enums', () => {
    expect(schema.businessTypeEnum).toBeDefined();
    expect(schema.roleEnum).toBeDefined();
    expect(schema.itemTypeEnum).toBeDefined();
    expect(schema.transactionTypeEnum).toBeDefined();
    expect(schema.debtStatusEnum).toBeDefined();
    expect(schema.jobStatusEnum).toBeDefined();
  });
});
