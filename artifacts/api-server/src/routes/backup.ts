import { Router, type IRouter } from "express";
import { requireAuth, requireAdmin } from "../lib/auth";
import { runBackup } from "../lib/supabase-backup";

const router: IRouter = Router();

router.post("/backup", requireAuth, requireAdmin, async (req, res) => {
  const result = await runBackup();
  res.status(result.success ? 200 : 500).json(result);
});

router.get("/backup/status", requireAuth, requireAdmin, async (_req, res) => {
  res.json({ message: "Use POST /api/backup to trigger a manual backup." });
});

export default router;
