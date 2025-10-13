import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';
import { config } from '../config';
import { logger } from '../logger';

async function runMigrations() {
  const pool = new Pool({
    connectionString: config.database.url,
  });

  try {
    // Read and execute the initial migration
    const migrationPath = join(__dirname, '../sql/001_init.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    logger.info('Running database migrations...');

    await pool.query(migrationSQL);

    logger.info('Database migrations completed successfully');
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations().catch((error) => {
    logger.error('Migration script failed:', error);
    process.exit(1);
  });
}

export { runMigrations };
