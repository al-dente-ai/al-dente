import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const configSchema = z.object({
  node: z.object({
    env: z.enum(['development', 'production', 'test']).default('development'),
  }),
  server: z.object({
    port: z.coerce.number().min(1000).max(65535).default(3000),
  }),
  database: z.object({
    url: z.string().min(1),
  }),
  auth: z.object({
    jwtSecret: z.string().min(32),
  }),
  openai: z.object({
    apiKey: z.string().min(1),
  }),
  supabase: z.object({
    url: z.string().url(),
    serviceRoleKey: z.string().min(1),
    imageBucket: z.string().min(1),
  }),
  cors: z.object({
    frontendOrigin: z.string().url(),
  }),
  logging: z.object({
    level: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  }),
});

function validateConfig() {
  const rawConfig = {
    node: {
      env: process.env.NODE_ENV,
    },
    server: {
      port: process.env.PORT,
    },
    database: {
      url: process.env.DATABASE_URL,
    },
    auth: {
      jwtSecret: process.env.JWT_SECRET,
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
    },
    supabase: {
      url: process.env.SUPABASE_URL,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      imageBucket: process.env.SUPABASE_IMAGE_BUCKET,
    },
    cors: {
      frontendOrigin: process.env.FRONTEND_ORIGIN,
    },
    logging: {
      level: process.env.LOG_LEVEL,
    },
  };

  try {
    return configSchema.parse(rawConfig);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingFields = error.errors.map((err) => err.path.join('.')).join(', ');
      throw new Error(`Invalid configuration. Missing or invalid fields: ${missingFields}`);
    }
    throw error;
  }
}

export const config = validateConfig();
export type Config = z.infer<typeof configSchema>;
