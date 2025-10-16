import { drizzleDb } from '../db';
import { items } from '../../drizzle/schema';
import { desc, eq } from 'drizzle-orm';

async function main() {
  // Simple typed query to ensure generated schema works with our db client
  const userId = '00000000-0000-0000-0000-000000000000'; // dummy UUID
  const rows = await drizzleDb
    .select({ id: items.id, name: items.name })
    .from(items)
    .where(eq(items.userId, userId))
    .orderBy(desc(items.createdAt))
    .limit(1);
  console.log('Drizzle smoke query ok, rows:', rows.length);
}

main().catch((err) => {
  console.error('Drizzle smoke test failed:', err);
  process.exit(1);
});
