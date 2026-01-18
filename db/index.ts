import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

try {
  const url = new URL(connectionString);
  console.log(`🔌 Connecting to database at ${url.host}${url.pathname}`);
} catch (e) {
  console.log('🔌 Connecting to database via custom connection string');
}

// For migrations
export const migrationClient = postgres(connectionString, { max: 1 });

// For query purposes
const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });
