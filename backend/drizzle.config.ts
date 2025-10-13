import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for Drizzle config');
}

export default defineConfig({
  dialect: 'postgresql',
  // Where your TypeScript schema lives (introspection will generate here)
  schema: './drizzle/schema.ts',
  // Where SQL migrations will be placed if/when you use `drizzle-kit generate`
  out: './drizzle',
  dbCredentials: {
    url: databaseUrl,
  },
});
