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

  // ==========================================
  // Tenant 3: Insights Demo (Advanced Analytics)
  // ==========================================
  console.log('Seeding Insights Demo...');
  const [insightsAccount] = await db.insert(schema.accounts).values({
    name: 'Insights Analytics Demo',
    businessType: 'hybrid',
    timezone: 'UTC'
  }).returning();

  const [insightsLocation] = await db.insert(schema.locations).values({
    accountId: insightsAccount.id,
    name: 'Global Insights HQ'
  }).returning();

  const [insightsUser] = await db.insert(schema.users).values({
    email: 'admin@insights.com',
    username: 'insights_admin',
    name: 'Insights Admin',
    passwordHash: demoPasswordHash
  }).returning();

  await db.insert(schema.userAccountRoles).values({
    userId: insightsUser.id,
    accountId: insightsAccount.id,
    role: 'owner'
  });

  await db.insert(schema.userLocationAccess).values({
    userId: insightsUser.id,
    accountId: insightsAccount.id,
    locationId: insightsLocation.id
  });

  const [insightsCustomer] = await db.insert(schema.customers).values({
    accountId: insightsAccount.id,
    name: 'Whale Client Inc',
    phone: '555-9999'
  }).returning();

  const [insightsGood] = await db.insert(schema.offerings).values({
    accountId: insightsAccount.id,
    name: 'Critical Inventory Item',
    category: 'Hardware',
    itemType: 'good',
    tracksStock: true,
    currentStock: 2, // Critically low! Will trigger Low Stock Action List
    priceCents: 50000, 
    costCents: 20000
  }).returning();

  const [insightsService] = await db.insert(schema.offerings).values({
    accountId: insightsAccount.id,
    name: 'Enterprise Retainer',
    category: 'Consulting',
    itemType: 'service',
    tracksStock: false,
    priceCents: 200000, 
    costCents: 0
  }).returning();

  // Seed 14 days of transactions
  console.log('Generating 14 days of historical transactions...');
  const today = new Date();
  const txData = [];
  const lineData = [];

  for (let i = 14; i >= 0; i--) {
    const bizDate = new Date(today);
    bizDate.setDate(today.getDate() - i);
    
    // Anomaly simulation: massive revenue drop in the last 2 days
    const isAnomalyPeriod = i <= 2;
    const dailyTxCount = isAnomalyPeriod ? 1 : 5; // Dropped from 5 sales a day to 1

    for (let j = 0; j < dailyTxCount; j++) {
      const [tx] = await db.insert(schema.transactions).values({
        accountId: insightsAccount.id,
        locationId: insightsLocation.id,
        transactionType: 'sale',
        totalCents: isAnomalyPeriod ? 50000 : 250000, // 80% revenue drop
        customerId: insightsCustomer.id,
        createdBy: insightsUser.id,
        createdAt: bizDate
      }).returning();

      if (isAnomalyPeriod) {
        await db.insert(schema.transactionLines).values({
          accountId: insightsAccount.id,
          transactionId: tx.id,
          offeringId: insightsGood.id,
          quantity: 1,
          unitPriceCents: 50000,
          lineTotalCents: 50000,
          unitCostAtTimeOfSaleCents: 20000,
          createdAt: bizDate
        });
      } else {
        await db.insert(schema.transactionLines).values({
          accountId: insightsAccount.id,
          transactionId: tx.id,
          offeringId: insightsService.id,
          quantity: 1,
          unitPriceCents: 200000,
          lineTotalCents: 200000,
          unitCostAtTimeOfSaleCents: 0,
          createdAt: bizDate
        });
        await db.insert(schema.transactionLines).values({
          accountId: insightsAccount.id,
          transactionId: tx.id,
          offeringId: insightsGood.id,
          quantity: 1,
          unitPriceCents: 50000,
          lineTotalCents: 50000,
          unitCostAtTimeOfSaleCents: 20000,
          createdAt: bizDate
        });
      }
    }
  }

  // Calculate Rollups and Analytics mathematically
  console.log('Computing L1 & L2 Analytics via worker engine...');
  const { computeDailyRollups } = await import('../../modules/analytics/worker');
  const { computeL1Snapshots } = await import('../../modules/analytics/snapshots');
  const { evaluateAnomalyAlerts } = await import('../../modules/analytics/alerts');

  // Compute rollups for all 14 days
  for (let i = 14; i >= 0; i--) {
    const bizDate = new Date(today);
    bizDate.setDate(today.getDate() - i);
    const dateStr = bizDate.toISOString().split('T')[0];
    await computeDailyRollups(insightsAccount.id, insightsLocation.id, dateStr);
    await computeDailyRollups(insightsAccount.id, null, dateStr);
  }

  // Compute L1 Snapshots
  await computeL1Snapshots(insightsAccount.id, null);

  // Compute L2 Anomaly Alerts (run multiple times to simulate daily progression and trigger ACTIVE state)
  await evaluateAnomalyAlerts(insightsAccount.id); // Triggers candidate
  await evaluateAnomalyAlerts(insightsAccount.id); // Transitions to active

  console.log('✅ Seeding complete!');
  
  // Close the database connection
  await client.end();
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
