import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';
import { config } from '../config';
import { logger } from '../logger';

async function runMigrations() {
  const pool = new Pool({
    connectionString: config.database.url,
  });

  try {
    logger.info('Running database migrations...');

    // Get all migration files from the sql directory
    // Use the source directory since SQL files aren't copied to dist
    const sqlDir = join(__dirname, '../../src/sql');

    let files: string[];
    try {
      files = readdirSync(sqlDir)
        .filter((file: string) => file.endsWith('.sql'))
        .sort(); // Run in order
    } catch (error) {
      logger.error({ error, sqlDir }, 'Failed to read SQL directory');
      throw new Error(`Cannot find SQL directory at ${sqlDir}`);
    }

    if (files.length === 0) {
      logger.warn('No SQL migration files found');
      return;
    }

    // Execute each migration file
    for (const file of files) {
      logger.info(`Running migration: ${file}`);
      try {
        const migrationPath = join(sqlDir, file);
        const migrationSQL = readFileSync(migrationPath, 'utf8');
        await pool.query(migrationSQL);
        logger.info(`Completed migration: ${file}`);
      } catch (fileError: any) {
        logger.error(
          { file, error: fileError, message: fileError.message, detail: fileError.detail },
          `Migration ${file} failed`
        );
        throw fileError;
      }
    }

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
