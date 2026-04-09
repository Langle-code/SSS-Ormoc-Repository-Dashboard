import { Router, type IRouter } from "express";
import { db, employersTable } from "@workspace/db";
import { eq, ilike, or } from "drizzle-orm";
import {
  CreateEmployerBody,
  GetEmployerParams,
  UpdateEmployerParams,
  UpdateEmployerBody,
  DeleteEmployerParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/employers", requireAuth, async (req, res): Promise<void> => {
  const search = req.query.search as string | undefined;
  const jurisdiction = req.query.jurisdiction as string | undefined;

  let query = db.select().from(employersTable).orderBy(employersTable.createdAt).$dynamic();

  const conditions = [];
  if (search) {
    conditions.push(
      or(
        ilike(employersTable.name, `%${search}%`),
        ilike(employersTable.employerId, `%${search}%`),
      )
    );
  }
  if (jurisdiction) {
    conditions.push(eq(employersTable.jurisdiction, jurisdiction));
  }

  if (conditions.length > 0) {
    for (const cond of conditions) {
      if (cond) query = query.where(cond);
    }
  }

  const employers = await query;
  res.json(employers);
});

router.post("/employers", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateEmployerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [employer] = await db.insert(employersTable).values(parsed.data).returning();
  res.status(201).json(employer);
});

router.get("/employers/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetEmployerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [employer] = await db.select().from(employersTable).where(eq(employersTable.id, params.data.id));
  if (!employer) {
    res.status(404).json({ error: "Employer not found" });
    return;
  }

  res.json(employer);
});

router.patch("/employers/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateEmployerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateEmployerBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [employer] = await db.update(employersTable)
    .set(body.data)
    .where(eq(employersTable.id, params.data.id))
    .returning();

  if (!employer) {
    res.status(404).json({ error: "Employer not found" });
    return;
  }

  res.json(employer);
});

router.delete("/employers/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteEmployerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [employer] = await db.delete(employersTable)
    .where(eq(employersTable.id, params.data.id))
    .returning();

  if (!employer) {
    res.status(404).json({ error: "Employer not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
