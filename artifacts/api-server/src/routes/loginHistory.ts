import { Router, type IRouter } from "express";
import { db, loginHistoryTable, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/login-history", requireAuth, async (_req, res): Promise<void> => {
  const entries = await db
    .select({
      id: loginHistoryTable.id,
      userId: loginHistoryTable.userId,
      userName: usersTable.name,
      userEmail: usersTable.email,
      userRole: usersTable.role,
      jurisdiction: sql<string>`COALESCE(${usersTable.jurisdictions}[1], 'Unknown')`,
      browser: loginHistoryTable.browser,
      loginAt: loginHistoryTable.loginAt,
    })
    .from(loginHistoryTable)
    .leftJoin(usersTable, eq(loginHistoryTable.userId, usersTable.id))
    .orderBy(sql`${loginHistoryTable.loginAt} DESC`);

  res.json(entries);
});

router.delete("/login-history", requireAuth, async (_req, res): Promise<void> => {
  await db.delete(loginHistoryTable);
  res.sendStatus(204);
});

export default router;
