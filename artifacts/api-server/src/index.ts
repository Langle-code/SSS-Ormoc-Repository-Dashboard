import app from "./app";
import { logger } from "./lib/logger";
import { runBackup } from "./lib/supabase-backup";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  runBackup().then((result) => {
    if (result.success) {
      logger.info({ tables: result.tables }, "Startup Supabase backup complete");
    } else {
      logger.warn({ error: result.error }, "Startup Supabase backup failed");
    }
  });
});
