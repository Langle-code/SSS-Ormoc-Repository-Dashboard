import { Router, type IRouter } from "express";
import { db, employersTable, documentsTable } from "@workspace/db";
import { eq, and, inArray, count } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/dashboard/stats", requireAuth, async (req, res): Promise<void> => {
  const jurisdictionQuery = req.query.jurisdiction as string | undefined;

  // Build jurisdiction filters
  let docJurisdictionFilter = undefined;
  let empJurisdictionFilter = undefined;

  if (jurisdictionQuery) {
    docJurisdictionFilter = eq(documentsTable.jurisdiction, jurisdictionQuery);
    empJurisdictionFilter = eq(employersTable.jurisdiction, jurisdictionQuery);
  } else if (req.session?.role === "account_officer") {
    const userJurisdictions = req.session.jurisdictions || [];
    const hasAll = userJurisdictions.includes("All Jurisdictions");
    if (!hasAll && userJurisdictions.length > 0) {
      docJurisdictionFilter = inArray(documentsTable.jurisdiction, userJurisdictions);
      empJurisdictionFilter = inArray(employersTable.jurisdiction, userJurisdictions);
    }
  }

  const [employerCount] = await db
    .select({ count: count() })
    .from(employersTable)
    .where(empJurisdictionFilter);

  const [totalDocs] = await db
    .select({ count: count() })
    .from(documentsTable)
    .where(docJurisdictionFilter);

  const [pendingDocs] = await db
    .select({ count: count() })
    .from(documentsTable)
    .where(and(docJurisdictionFilter, eq(documentsTable.status, "pending")));

  const [approvedDocs] = await db
    .select({ count: count() })
    .from(documentsTable)
    .where(and(docJurisdictionFilter, eq(documentsTable.status, "approved")));

  const [rejectedDocs] = await db
    .select({ count: count() })
    .from(documentsTable)
    .where(and(docJurisdictionFilter, eq(documentsTable.status, "rejected")));

  res.json({
    totalEmployers: employerCount.count,
    totalDocuments: totalDocs.count,
    pendingDocuments: pendingDocs.count,
    approvedDocuments: approvedDocs.count,
    rejectedDocuments: rejectedDocs.count,
  });
});

export default router;
