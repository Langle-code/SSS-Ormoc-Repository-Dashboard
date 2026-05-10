import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// Prefer Supabase as the primary database when available; fall back to the
// Replit-provisioned DATABASE_URL. This keeps the app's data in Supabase so it
// survives Replit-level disruptions, while still allowing local-only setups.
const connectionString =
  process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "Neither SUPABASE_DATABASE_URL nor DATABASE_URL is set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });

export * from "./schema";
