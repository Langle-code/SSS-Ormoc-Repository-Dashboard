import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { pool } from "@workspace/db";
import { logger } from "./logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>;

function getSupabaseClient(): AnySupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set");
  }
  return createClient(url, key);
}

const SETUP_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id serial PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'account_officer',
  jurisdictions text[] NOT NULL DEFAULT '{}',
  login_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  reset_token text,
  reset_token_expiry timestamptz
);

CREATE TABLE IF NOT EXISTS jurisdictions (
  id serial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  category text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employers (
  id serial PRIMARY KEY,
  employer_id text NOT NULL,
  name text NOT NULL,
  address text NOT NULL,
  jurisdiction text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
  id serial PRIMARY KEY,
  form_name text NOT NULL,
  form_type text NOT NULL DEFAULT 'R1/R1A',
  employer_id integer NOT NULL,
  jurisdiction text NOT NULL,
  file_url text NOT NULL,
  file_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  uploaded_by integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS login_history (
  id serial PRIMARY KEY,
  user_id integer NOT NULL,
  browser text NOT NULL DEFAULT 'Unknown',
  login_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS document_types (
  id serial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
`;

function extractProjectRef(): string {
  const url = process.env.SUPABASE_URL ?? "";
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (!match) throw new Error(`Cannot extract project ref from SUPABASE_URL: ${url}`);
  return match[1];
}

async function runDdlViaManagementApi(): Promise<void> {
  const mgmtKey = process.env.SUPABASE_MANAGEMENT_KEY;
  if (!mgmtKey) throw new Error("SUPABASE_MANAGEMENT_KEY not set");

  const projectRef = extractProjectRef();
  const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${mgmtKey}`,
    },
    body: JSON.stringify({ query: SETUP_SQL }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Management API DDL failed: ${res.status} ${text}`);
  }
  logger.info("Tables ensured via Supabase Management API");
}

async function syncTable(
  supabase: AnySupabaseClient,
  tableName: string,
  primaryKey = "id"
): Promise<{ table: string; synced: number }> {
  const { rows } = await pool.query(`SELECT * FROM ${tableName} ORDER BY ${primaryKey}`);
  if (rows.length === 0) {
    logger.info({ table: tableName }, "No rows to sync");
    return { table: tableName, synced: 0 };
  }

  const { error } = await supabase
    .from(tableName)
    .upsert(rows as Record<string, unknown>[], {
      onConflict: primaryKey,
      ignoreDuplicates: false,
    });

  if (error) {
    throw new Error(`Failed to sync ${tableName}: ${(error as { message: string }).message}`);
  }

  logger.info({ table: tableName, rows: rows.length }, "Table synced");
  return { table: tableName, synced: rows.length as number };
}

export interface BackupResult {
  success: boolean;
  timestamp: string;
  tables: { table: string; synced: number }[];
  error?: string;
}

export async function runBackup(): Promise<BackupResult> {
  const timestamp = new Date().toISOString();
  logger.info("Starting Supabase backup");

  try {
    await runDdlViaManagementApi();

    const supabase = getSupabaseClient();

    const results = await Promise.all([
      syncTable(supabase, "users"),
      syncTable(supabase, "jurisdictions"),
      syncTable(supabase, "employers"),
      syncTable(supabase, "documents"),
      syncTable(supabase, "login_history"),
      syncTable(supabase, "document_types"),
    ]);

    logger.info({ tables: results }, "Supabase backup complete");
    return { success: true, timestamp, tables: results };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ err }, "Supabase backup failed");
    return { success: false, timestamp, tables: [], error: message };
  }
}
