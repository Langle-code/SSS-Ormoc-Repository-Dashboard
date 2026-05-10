import pg from "pg";
import { pool as primaryPool } from "@workspace/db";
import { logger } from "./logger";

const { Pool } = pg;

// The app's primary DB is Supabase (see lib/db/src/index.ts). This module
// performs a reverse backup: Supabase (primary) -> Replit DB (fallback).
// If Replit's DATABASE_URL is unset, or it points at the same connection as
// the primary, the backup is skipped.

const TABLES = [
  "users",
  "employers",
  "jurisdictions",
  "document_types",
  "documents",
  "login_history",
] as const;

const COLUMNS: Record<(typeof TABLES)[number], string[]> = {
  users: [
    "id",
    "email",
    "password_hash",
    "name",
    "role",
    "jurisdictions",
    "login_count",
    "created_at",
    "reset_token",
    "reset_token_expiry",
  ],
  employers: ["id", "employer_id", "name", "address", "jurisdiction", "created_at"],
  jurisdictions: ["id", "name", "category", "created_at"],
  document_types: ["id", "name", "created_at"],
  documents: [
    "id",
    "form_name",
    "form_type",
    "employer_id",
    "jurisdiction",
    "file_url",
    "file_name",
    "status",
    "uploaded_by",
    "created_at",
  ],
  login_history: ["id", "user_id", "browser", "login_at"],
};

function getBackupPool(): pg.Pool | null {
  const replitUrl = process.env.DATABASE_URL;
  const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
  if (!replitUrl) return null;
  if (supabaseUrl && replitUrl === supabaseUrl) return null;
  return new Pool({ connectionString: replitUrl });
}

async function syncTable(
  backup: pg.Pool,
  table: (typeof TABLES)[number],
): Promise<{ table: string; synced: number }> {
  const cols = COLUMNS[table];
  const colList = cols.join(",");

  const { rows } = await primaryPool.query(`SELECT ${colList} FROM ${table}`);

  // Replace the backup table contents with the primary snapshot. Always run
  // the TRUNCATE — even when the primary is empty — so the mirror stays in
  // sync if rows are deleted upstream. The transaction keeps the backup from
  // ever being observed in a half-written state.
  const client = await backup.connect();
  try {
    await client.query("BEGIN");
    await client.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);

    if (rows.length > 0) {
      // Postgres caps bound parameters at 65535 per statement. Chunk inserts
      // so very large tables stay well under that limit.
      const maxParamsPerStmt = 60000;
      const rowsPerChunk = Math.max(1, Math.floor(maxParamsPerStmt / cols.length));
      for (let i = 0; i < rows.length; i += rowsPerChunk) {
        const chunk = rows.slice(i, i + rowsPerChunk);
        const placeholders: string[] = [];
        const params: unknown[] = [];
        let p = 1;
        for (const r of chunk) {
          placeholders.push(`(${cols.map(() => `$${p++}`).join(",")})`);
          for (const c of cols) params.push(r[c]);
        }
        await client.query(
          `INSERT INTO ${table} (${colList}) VALUES ${placeholders.join(",")}`,
          params,
        );
      }
      await client.query(
        `SELECT setval(pg_get_serial_sequence('${table}','id'), (SELECT MAX(id) FROM ${table}), true)`,
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  return { table, synced: rows.length };
}

export interface BackupResult {
  success: boolean;
  timestamp: string;
  tables: { table: string; synced: number }[];
  error?: string;
  skipped?: boolean;
}

export async function runBackup(): Promise<BackupResult> {
  const timestamp = new Date().toISOString();
  const backup = getBackupPool();

  if (!backup) {
    logger.info("Reverse backup skipped (no separate Replit DATABASE_URL configured)");
    return { success: true, timestamp, tables: [], skipped: true };
  }

  logger.info("Starting reverse backup: Supabase -> Replit DB");

  try {
    const tables: { table: string; synced: number }[] = [];
    const errors: string[] = [];

    // Run sequentially so FK-dependent tables (documents, login_history) are
    // synced after their parents (users, employers).
    for (const t of TABLES) {
      try {
        tables.push(await syncTable(backup, t));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${t}: ${msg}`);
        logger.warn({ table: t, err: msg }, "Backup table sync failed");
      }
    }

    logger.info({ tables, errors }, "Reverse backup complete");
    return {
      success: errors.length === 0,
      timestamp,
      tables,
      ...(errors.length ? { error: errors.join("; ") } : {}),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ err }, "Reverse backup failed");
    return { success: false, timestamp, tables: [], error: message };
  } finally {
    await backup.end().catch(() => {});
  }
}
