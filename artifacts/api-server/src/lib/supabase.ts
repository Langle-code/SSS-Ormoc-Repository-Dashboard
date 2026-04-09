import { createClient } from "@supabase/supabase-js";
import { logger } from "./logger";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  logger.warn("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — file uploads will fail");
}

export const supabase = createClient(supabaseUrl || "", supabaseKey || "");
export const BUCKET_NAME = "documents";
