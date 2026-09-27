import { client } from './lib/db/drizzle';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const file1 = path.join(__dirname, 'lib/db/migrations/0001_rls_policies.sql');
  const sql1 = fs.readFileSync(file1, 'utf-8');
  await client.unsafe(sql1);
  console.log('Applied 0001');

  const file2 = path.join(__dirname, 'lib/db/migrations/0002_force_rls.sql');
  const sql2 = fs.readFileSync(file2, 'utf-8');
  await client.unsafe(sql2);
  console.log('Applied 0002');
  
  await client.end();
}
main().catch(console.error);
