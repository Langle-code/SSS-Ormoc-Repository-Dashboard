import { Router, type IRouter } from "express";
import { db, documentsTable, employersTable, usersTable } from "@workspace/db";
import { eq, and, inArray, sql } from "drizzle-orm";
import {
  UploadDocumentBody,
  GetDocumentParams,
  UpdateDocumentStatusParams,
  UpdateDocumentStatusBody,
  DeleteDocumentParams,
  GetUploadUrlBody,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../lib/auth";
import { supabase, BUCKET_NAME } from "../lib/supabase";
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.get("/documents", requireAuth, async (req, res): Promise<void> => {
  const status = req.query.status as string | undefined;
  const jurisdiction = req.query.jurisdiction as string | undefined;
  const employerIdStr = req.query.employerId as string | undefined;

  const conditions = [];
  if (status) {
    conditions.push(eq(documentsTable.status, status));
  }
  if (jurisdiction) {
    conditions.push(eq(documentsTable.jurisdiction, jurisdiction));
  }
  if (employerIdStr) {
    const eid = parseInt(employerIdStr, 10);
    if (!isNaN(eid)) {
      conditions.push(eq(documentsTable.employerId, eid));
    }
  }

  if (req.session?.role === "account_officer") {
    const userJurisdictions = req.session.jurisdictions || [];
    const hasAll = userJurisdictions.includes("All Jurisdictions");
    if (!hasAll && userJurisdictions.length > 0) {
      conditions.push(inArray(documentsTable.jurisdiction, userJurisdictions));
    }
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const docs = await db
    .select({
      id: documentsTable.id,
      formName: documentsTable.formName,
      formType: documentsTable.formType,
      employerId: documentsTable.employerId,
      employerName: employersTable.name,
      jurisdiction: documentsTable.jurisdiction,
      fileUrl: documentsTable.fileUrl,
      fileName: documentsTable.fileName,
      status: documentsTable.status,
      uploadedBy: documentsTable.uploadedBy,
      uploadedByName: usersTable.name,
      createdAt: documentsTable.createdAt,
    })
    .from(documentsTable)
    .leftJoin(employersTable, eq(documentsTable.employerId, employersTable.id))
    .leftJoin(usersTable, eq(documentsTable.uploadedBy, usersTable.id))
    .where(whereClause)
    .orderBy(sql`${documentsTable.createdAt} DESC`);

  res.json(docs);
});

router.post("/documents", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const parsed = UploadDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [employer] = await db.select().from(employersTable).where(eq(employersTable.id, parsed.data.employerId));
  if (!employer) {
    res.status(400).json({ error: "Employer not found" });
    return;
  }

  const [doc] = await db.insert(documentsTable).values({
    formName: parsed.data.formName,
    formType: parsed.data.formType,
    employerId: parsed.data.employerId,
    jurisdiction: employer.jurisdiction,
    fileUrl: parsed.data.fileUrl,
    fileName: parsed.data.fileName,
    uploadedBy: req.session!.userId,
  }).returning();

  const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, req.session!.userId));

  res.status(201).json({
    ...doc,
    employerName: employer.name,
    uploadedByName: user?.name || "Unknown",
  });
});

router.get("/documents/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetDocumentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [doc] = await db
    .select({
      id: documentsTable.id,
      formName: documentsTable.formName,
      formType: documentsTable.formType,
      employerId: documentsTable.employerId,
      employerName: employersTable.name,
      jurisdiction: documentsTable.jurisdiction,
      fileUrl: documentsTable.fileUrl,
      fileName: documentsTable.fileName,
      status: documentsTable.status,
      uploadedBy: documentsTable.uploadedBy,
      uploadedByName: usersTable.name,
      createdAt: documentsTable.createdAt,
    })
    .from(documentsTable)
    .leftJoin(employersTable, eq(documentsTable.employerId, employersTable.id))
    .leftJoin(usersTable, eq(documentsTable.uploadedBy, usersTable.id))
    .where(eq(documentsTable.id, params.data.id));

  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  res.json(doc);
});

router.patch("/documents/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateDocumentStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateDocumentStatusBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [doc] = await db.update(documentsTable)
    .set({ status: body.data.status })
    .where(eq(documentsTable.id, params.data.id))
    .returning();

  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  const [employer] = await db.select({ name: employersTable.name }).from(employersTable).where(eq(employersTable.id, doc.employerId));
  const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, doc.uploadedBy));

  res.json({
    ...doc,
    employerName: employer?.name || "Unknown",
    uploadedByName: user?.name || "Unknown",
  });
});

router.delete("/documents/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteDocumentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [doc] = await db.delete(documentsTable)
    .where(eq(documentsTable.id, params.data.id))
    .returning();

  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/documents/upload-url", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const parsed = GetUploadUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const fileExt = parsed.data.fileName.split(".").pop() || "pdf";
  const filePath = `uploads/${randomUUID()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUploadUrl(filePath);

  if (error || !data) {
    req.log.error({ error }, "Failed to create upload URL");
    res.status(500).json({ error: "Failed to create upload URL" });
    return;
  }

  const { data: publicData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

  res.json({
    uploadUrl: data.signedUrl,
    fileUrl: publicData.publicUrl,
    filePath,
  });
});

export default router;
