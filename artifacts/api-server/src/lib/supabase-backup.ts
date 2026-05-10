import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { pool } from "@workspace/db";
import { logger } from "./logger";
import { randomUUID } from "crypto";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = SupabaseClient<any, any, any>;

function getClient(): AnyClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set");
  return createClient(url, key);
}

async function doInsert(
  sb: AnyClient,
  table: string,
  rows: Record<string, unknown>[]
): Promise<number> {
  if (rows.length === 0) return 0;
  const { error } = await sb.from(table).insert(rows);
  if (error) throw new Error(`Insert into ${table} failed: ${(error as { message: string }).message}`);
  return rows.length;
}

async function doUpsert(
  sb: AnyClient,
  table: string,
  rows: Record<string, unknown>[],
  onConflict: string
): Promise<number> {
  if (rows.length === 0) return 0;
  const { error } = await sb.from(table).upsert(rows, { onConflict, ignoreDuplicates: true });
  if (error) throw new Error(`Upsert into ${table} failed: ${(error as { message: string }).message}`);
  return rows.length;
}

// --- profiles (users) ---
// Supabase profiles.id is a FK to auth.users — we cannot insert new rows freely.
// Instead, update existing profiles that match by email (set name/role/jurisdiction).
async function syncProfiles(sb: AnyClient): Promise<{ table: string; synced: number }> {
  const { rows } = await pool.query(`SELECT email, name, role, jurisdictions FROM users ORDER BY id`);

  const { data: existing } = await sb.from("profiles").select("id,email");
  const profileByEmail = new Map((existing ?? []).map((r: Record<string, unknown>) => [r["email"] as string, r["id"] as string]));

  let synced = 0;
  for (const r of rows) {
    const profileId = profileByEmail.get(r["email"] as string);
    if (!profileId) continue; // can't insert — must come from auth

    const { error } = await sb.from("profiles").update({
      full_name: r["name"],
      role: r["role"],
      jurisdiction: Array.isArray(r["jurisdictions"])
        ? (r["jurisdictions"] as string[]).join(", ")
        : "",
    }).eq("id", profileId);

    if (error) {
      logger.warn({ email: r["email"], err: error.message }, "profile update failed");
    } else {
      synced++;
    }
  }

  logger.info({ table: "profiles", synced, total: rows.length }, "profiles synced");
  return { table: "profiles (users)", synced };
}

// --- employers ---
// Supabase columns: id (uuid), name, address, jurisdiction, created_at, er_number
// No unique constraint on er_number — check existing before insert
async function syncEmployers(sb: AnyClient): Promise<{ table: string; synced: number }> {
  const { rows } = await pool.query(`SELECT employer_id, name, address, jurisdiction, created_at FROM employers ORDER BY id`);

  const { data: existing } = await sb.from("employers").select("er_number");
  const existingNums = new Set((existing ?? []).map((r: Record<string, unknown>) => r["er_number"] as string));

  const toInsert = rows
    .filter((r: Record<string, unknown>) => !existingNums.has(r["employer_id"] as string))
    .map((r: Record<string, unknown>) => ({
      er_number: r["employer_id"],
      name: r["name"],
      address: r["address"],
      jurisdiction: r["jurisdiction"],
      created_at: r["created_at"],
    }));

  const synced = await doInsert(sb, "employers", toInsert);
  logger.info({ table: "employers", inserted: synced }, "employers synced");
  return { table: "employers", synced };
}

// --- scanned_forms (documents) ---
// Supabase columns: id(uuid), form_name, form_type, employer_id(uuid), employer_name,
//   jurisdiction_location, file_url, quality_status, upload_date, uploaded_by, created_at
// Map our document.status -> quality_status using existing constraint values
// Valid quality_status values: need to use something safe — skip if none found, use 'approved'/'pending'
async function syncScannedForms(sb: AnyClient): Promise<{ table: string; synced: number }> {
  const { rows } = await pool.query(`
    SELECT d.id, d.form_name, d.form_type, d.jurisdiction, d.file_url, d.status,
           d.created_at, e.employer_id AS er_number, e.name AS employer_name
    FROM documents d
    LEFT JOIN employers e ON e.id = d.employer_id
    ORDER BY d.id
  `);
  if (rows.length === 0) return { table: "scanned_forms (documents)", synced: 0 };

  // Fetch Supabase employer UUIDs by er_number
  const erNums = [...new Set(rows.map((r: Record<string, unknown>) => r["er_number"] as string).filter(Boolean))];
  const { data: sbEmployers } = erNums.length > 0
    ? await sb.from("employers").select("id,er_number").in("er_number", erNums)
    : { data: [] };
  const employerMap = new Map((sbEmployers ?? []).map((e: Record<string, unknown>) => [e["er_number"] as string, e["id"] as string]));

  // Fetch existing form_names to avoid duplicates
  const { data: existing } = await sb.from("scanned_forms").select("form_name");
  const existingNames = new Set((existing ?? []).map((r: Record<string, unknown>) => r["form_name"] as string));

  const toInsert = rows
    .filter((r: Record<string, unknown>) => !existingNames.has(r["form_name"] as string))
    .map((r: Record<string, unknown>) => ({
      form_name: r["form_name"],
      form_type: r["form_type"],
      employer_id: employerMap.get(r["er_number"] as string) ?? null,
      employer_name: r["employer_name"] ?? "",
      jurisdiction_location: r["jurisdiction"],
      file_url: r["file_url"],
      quality_status: r["status"] === "approved" ? "Approved" : "Pending",
      upload_date: r["created_at"],
      created_at: r["created_at"],
    }));

  if (toInsert.length === 0) return { table: "scanned_forms (documents)", synced: 0 };

  // Test with first record to check if quality_status values work
  const testRow = toInsert[0];
  const { error: testErr } = await sb.from("scanned_forms").insert([testRow]);
  if (testErr) {
    logger.warn({ err: testErr.message }, "scanned_forms insert failed — skipping document sync");
    return { table: "scanned_forms (documents)", synced: 0 };
  }

  // Insert the rest
  const rest = toInsert.slice(1);
  if (rest.length > 0) await doInsert(sb, "scanned_forms", rest);

  logger.info({ table: "scanned_forms", synced: toInsert.length }, "scanned_forms synced");
  return { table: "scanned_forms (documents)", synced: toInsert.length };
}

// --- jurisdiction_catalog ---
// Supabase columns: name, category
// Valid categories (from check constraint): 'barangay', 'town', 'ormoc'
// Replit categories: 'BARANGAY' -> 'barangay', 'TOWN' -> 'town', 'ORMOC CITY' -> 'ormoc'
const CATEGORY_MAP: Record<string, string> = {
  "BARANGAY": "barangay",
  "TOWN": "town",
  "ORMOC CITY": "ormoc",
};

async function syncJurisdictions(sb: AnyClient): Promise<{ table: string; synced: number }> {
  const { rows } = await pool.query(`SELECT name, category FROM jurisdictions ORDER BY id`);

  const { data: existing } = await sb.from("jurisdiction_catalog").select("name");
  const existingNames = new Set((existing ?? []).map((r: Record<string, unknown>) => r["name"] as string));

  const toInsert = rows
    .filter((r: Record<string, unknown>) => !existingNames.has(r["name"] as string))
    .map((r: Record<string, unknown>) => ({
      name: r["name"],
      category: CATEGORY_MAP[r["category"] as string] ?? "ormoc",
    }));

  const synced = await doInsert(sb, "jurisdiction_catalog", toInsert);
  logger.info({ table: "jurisdiction_catalog", inserted: synced }, "jurisdiction_catalog synced");
  return { table: "jurisdiction_catalog (jurisdictions)", synced };
}

// --- document_types ---
// Supabase columns: name, created_at, created_by
async function syncDocumentTypes(sb: AnyClient): Promise<{ table: string; synced: number }> {
  const { rows } = await pool.query(`SELECT name, created_at FROM document_types ORDER BY id`);
  if (rows.length === 0) return { table: "document_types", synced: 0 };

  const synced = await doUpsert(
    sb,
    "document_types",
    rows.map((r: Record<string, unknown>) => ({ name: r["name"], created_at: r["created_at"] })),
    "name"
  );
  logger.info({ table: "document_types", synced }, "document_types synced");
  return { table: "document_types", synced };
}

// --- login_history ---
// Supabase columns: id(uuid), user_id(uuid), email, full_name, role, logged_in_at
// No unique key to upsert by — insert only new records (skip if already in bulk)
async function syncLoginHistory(sb: AnyClient): Promise<{ table: string; synced: number }> {
  const { rows } = await pool.query(`
    SELECT lh.login_at, lh.browser,
           u.email, u.name AS full_name, u.role
    FROM login_history lh
    LEFT JOIN users u ON u.id = lh.user_id
    ORDER BY lh.id
  `);
  if (rows.length === 0) return { table: "login_history", synced: 0 };

  // Fetch Supabase profile UUIDs by email
  const emails = [...new Set(rows.map((r: Record<string, unknown>) => r["email"] as string).filter(Boolean))];
  const { data: profiles } = emails.length > 0
    ? await sb.from("profiles").select("id,email").in("email", emails)
    : { data: [] };
  const profileMap = new Map((profiles ?? []).map((p: Record<string, unknown>) => [p["email"] as string, p["id"] as string]));

  // Check how many already exist (by count)
  const { count: existingCount } = await sb.from("login_history").select("*", { count: "exact", head: true });
  if ((existingCount ?? 0) >= rows.length) {
    logger.info({ table: "login_history", skipped: rows.length }, "login_history already backed up");
    return { table: "login_history", synced: 0 };
  }

  // Delete existing and re-insert all for a clean sync
  await sb.from("login_history").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  const toInsert = rows.map((r: Record<string, unknown>) => ({
    user_id: profileMap.get(r["email"] as string) ?? null,
    email: r["email"],
    full_name: r["full_name"],
    role: r["role"],
    logged_in_at: r["login_at"],
  }));

  const synced = await doInsert(sb, "login_history", toInsert);
  logger.info({ table: "login_history", synced }, "login_history synced");
  return { table: "login_history", synced };
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
    const sb = getClient();

    const settled = await Promise.allSettled([
      syncProfiles(sb),
      syncEmployers(sb),
      syncScannedForms(sb),
      syncJurisdictions(sb),
      syncDocumentTypes(sb),
      syncLoginHistory(sb),
    ]);

    const tables: { table: string; synced: number }[] = [];
    const errors: string[] = [];

    for (const r of settled) {
      if (r.status === "fulfilled") {
        tables.push(r.value);
      } else {
        const msg = r.reason instanceof Error ? r.reason.message : String(r.reason);
        errors.push(msg);
        logger.warn({ err: msg }, "Table sync failed (non-fatal)");
      }
    }

    const allFailed = tables.length === 0;
    logger.info({ tables, errors }, "Supabase backup complete");
    return {
      success: !allFailed,
      timestamp,
      tables,
      ...(errors.length ? { error: errors.join("; ") } : {}),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ err }, "Supabase backup failed");
    return { success: false, timestamp, tables: [], error: message };
  }
}
