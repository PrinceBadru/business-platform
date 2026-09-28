import { db, client } from './drizzle';
import * as schema from './schema';
import { sql } from 'drizzle-orm';
import * as argon2 from 'argon2';

async function seed() {
  console.log('🌱 Seeding database...');

  // Pre-hash the shared demo password once
  const demoPasswordHash = await argon2.hash('password123', {
    type: argon2.argon2id,
    timeCost: 3,
    memoryCost: 65536,
    parallelism: 4,
  });
  console.log('✓ Demo password hash generated');

  // Reset database state safely for local development
  await db.execute(sql`
    TRUNCATE TABLE 
      users, accounts, locations, customers, suppliers, offerings, 
      transactions, transaction_lines, debts, debt_payments, 
      user_account_roles, user_location_access, daily_summaries, jobs, sessions
    CASCADE;
  `);

  // ==========================================
  // Tenant 1: Acme Retail (Retail business)
  // ==========================================
  console.log('Seeding Acme Retail...');
  const [acmeAccount] = await db.insert(schema.accounts).values({
    name: 'Acme Retail',
    businessType: 'retail'
  }).returning();

  const [acmeLocation1] = await db.insert(schema.locations).values({
    accountId: acmeAccount.id,
    name: 'Downtown Store'
  }).returning();

  const [acmeLocation2] = await db.insert(schema.locations).values({
    accountId: acmeAccount.id,
    name: 'Uptown Store'
  }).returning();

  const [acmeUser] = await db.insert(schema.users).values({
    email: 'admin@acmeretail.com',
    username: 'acme_admin',
    name: 'Acme Admin',
    passwordHash: demoPasswordHash
  }).returning();

  await db.insert(schema.userAccountRoles).values({
    userId: acmeUser.id,
    accountId: acmeAccount.id,
    role: 'owner'
  });

  await db.insert(schema.userLocationAccess).values([
    { userId: acmeUser.id, accountId: acmeAccount.id, locationId: acmeLocation1.id },
    { userId: acmeUser.id, accountId: acmeAccount.id, locationId: acmeLocation2.id }
  ]);

  const [acmeCustomer] = await db.insert(schema.customers).values({
    accountId: acmeAccount.id,
    name: 'Alice Smith',
    phone: '555-0100'
  }).returning();

  const [acmeSupplier] = await db.insert(schema.suppliers).values({
    accountId: acmeAccount.id,
    name: 'Global Parts Inc.',
    contactInfo: 'support@globalparts.com'
  }).returning();

  const [acmeOffering] = await db.insert(schema.offerings).values({
    accountId: acmeAccount.id,
    name: 'Premium Widget',
    category: 'Hardware',
    itemType: 'good',
    tracksStock: true,
    supplierId: acmeSupplier.id,
    currentStock: 50,
    priceCents: 1500, // $15.00
    costCents: 800
  }).returning();

  const [acmeTransaction] = await db.insert(schema.transactions).values({
    accountId: acmeAccount.id,
    locationId: acmeLocation1.id,
    transactionType: 'sale',
    totalCents: 3000,
    customerId: acmeCustomer.id,
    createdBy: acmeUser.id
  }).returning();

  await db.insert(schema.transactionLines).values({
    accountId: acmeAccount.id,
    transactionId: acmeTransaction.id,
    offeringId: acmeOffering.id,
    quantity: 2,
    unitPriceCents: 1500,
    lineTotalCents: 3000
  });

  // ==========================================
  // Tenant 2: Globex Services (Service business)
  // ==========================================
  console.log('Seeding Globex Services...');
  const [globexAccount] = await db.insert(schema.accounts).values({
    name: 'Globex Services',
    businessType: 'services'
  }).returning();

  const [globexLocation] = await db.insert(schema.locations).values({
    accountId: globexAccount.id,
    name: 'Main HQ'
  }).returning();

  const [globexUser] = await db.insert(schema.users).values({
    email: 'admin@globex.com',
    username: 'globex_admin',
    name: 'Globex Admin',
    passwordHash: demoPasswordHash
  }).returning();

  await db.insert(schema.userAccountRoles).values({
    userId: globexUser.id,
    accountId: globexAccount.id,
    role: 'owner'
  });

  await db.insert(schema.userLocationAccess).values({
    userId: globexUser.id,
    accountId: globexAccount.id,
    locationId: globexLocation.id
  });

  const [globexOffering] = await db.insert(schema.offerings).values({
    accountId: globexAccount.id,
    name: 'Consulting Hour',
    category: 'Consulting',
    itemType: 'service',
    tracksStock: false,
    priceCents: 12000, // $120.00
    costCents: 0
  }).returning();

  const [globexTransaction] = await db.insert(schema.transactions).values({
    accountId: globexAccount.id,
    locationId: globexLocation.id,
    transactionType: 'service_delivery',
    totalCents: 12000,
    createdBy: globexUser.id
  }).returning();

  await db.insert(schema.transactionLines).values({
    accountId: globexAccount.id,
    transactionId: globexTransaction.id,
    offeringId: globexOffering.id,
    quantity: 1,
    unitPriceCents: 12000,
    lineTotalCents: 12000
  });

  console.log('✅ Seeding complete!');
  
  // Close the database connection
  await client.end();
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
