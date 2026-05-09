import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { documentTypesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth";

const router: IRouter = Router();

router.get("/document-types", requireAuth, async (_req, res): Promise<void> => {
  const types = await db.select().from(documentTypesTable).orderBy(documentTypesTable.createdAt);
  res.json(types.map((t) => ({ id: t.id, name: t.name, created_at: t.createdAt })));
});

router.post("/document-types", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const { name } = req.body;
  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "Name is required" });
    return;
  }
  const trimmed = name.trim();

  const existing = await db.select().from(documentTypesTable).where(eq(documentTypesTable.name, trimmed));
  if (existing.length > 0) {
    res.status(409).json({ error: "Document type already exists" });
    return;
  }

  const [created] = await db.insert(documentTypesTable).values({ name: trimmed }).returning();
  res.status(201).json(created);
});

router.delete("/document-types/:name", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const { name } = req.params;
  await db.delete(documentTypesTable).where(eq(documentTypesTable.name, name));
  res.json({ message: "Deleted" });
});

export default router;
