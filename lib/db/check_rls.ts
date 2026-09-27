import { client } from './drizzle';

async function main() {
  // Check RLS via pg_class (standard cross-version approach)
  const rls = await client`
    SELECT relname AS table_name,
           relrowsecurity AS rls_enabled,
           relforcerowsecurity AS force_rls
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    ORDER BY relname
  `;
  console.log('\n=== RLS Status per table ===');
  rls.forEach(r => console.log(r.table_name.padEnd(25), 'rls:', r.rls_enabled, '| force:', r.force_rls));

  // Check policies exist
  const policies = await client`
    SELECT tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public'
    ORDER BY tablename
  `;
  console.log('\n=== Policies ===');
  if (policies.length === 0) console.log('NO POLICIES FOUND — RLS not applied!');
  else policies.forEach(p => console.log(p.tablename.padEnd(25), p.policyname));

  await client.end();
}
main().catch(console.error);
