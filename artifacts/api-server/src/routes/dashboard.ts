import { Router, type IRouter } from "express";
import { db, employersTable, documentsTable } from "@workspace/db";
import { eq, sql, count } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/dashboard/stats", requireAuth, async (req, res): Promise<void> => {
  const jurisdiction = req.query.jurisdiction as string | undefined;

  let employerCondition;
  let docCondition;

  if (jurisdiction) {
    employerCondition = eq(employersTable.jurisdiction, jurisdiction);
    docCondition = eq(documentsTable.jurisdiction, jurisdiction);
  }

  if (req.session?.role === "account_officer") {
    const userJurisdictions = req.session.jurisdictions || [];
    if (userJurisdictions.length > 0 && !jurisdiction) {
      docCondition = sql`${documentsTable.jurisdiction} = ANY(${userJurisdictions})`;
      employerCondition = sql`${employersTable.jurisdiction} = ANY(${userJurisdictions})`;
    }
  }

  const [employerCount] = await db
    .select({ count: count() })
    .from(employersTable)
    .where(employerCondition);

  const [totalDocs] = await db
    .select({ count: count() })
    .from(documentsTable)
    .where(docCondition);

  const [pendingDocs] = await db
    .select({ count: count() })
    .from(documentsTable)
    .where(docCondition ? sql`${docCondition} AND ${documentsTable.status} = 'pending'` : eq(documentsTable.status, "pending"));

  const [approvedDocs] = await db
    .select({ count: count() })
    .from(documentsTable)
    .where(docCondition ? sql`${docCondition} AND ${documentsTable.status} = 'approved'` : eq(documentsTable.status, "approved"));

  const [rejectedDocs] = await db
    .select({ count: count() })
    .from(documentsTable)
    .where(docCondition ? sql`${docCondition} AND ${documentsTable.status} = 'rejected'` : eq(documentsTable.status, "rejected"));

  res.json({
    totalEmployers: employerCount.count,
    totalDocuments: totalDocs.count,
    pendingDocuments: pendingDocs.count,
    approvedDocuments: approvedDocs.count,
    rejectedDocuments: rejectedDocs.count,
  });
});

export default router;
