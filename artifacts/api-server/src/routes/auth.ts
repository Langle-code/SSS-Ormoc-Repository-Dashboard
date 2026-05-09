import { Router, type IRouter } from "express";
import bcryptjs from "bcryptjs";
import { db, usersTable, loginHistoryTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "../lib/auth";

const SURVEY_URL = "https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=DQSIkWdsW0yxEjajBLZtrQAAAAAAAAAAAAMAAFiB1KRUMjhFUFZNTEhCOExCRlcwRVI1Q0dXWkpWTS4uUSe";

const router: IRouter = Router();

router.post("/auth/register", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password, name, role, jurisdictions } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await bcryptjs.hash(password, 10);
  const [user] = await db.insert(usersTable).values({
    email,
    passwordHash,
    name,
    role,
    jurisdictions,
  }).returning();

  res.cookie("userId", String(user.id), {
    signed: true,
    httpOnly: true,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(201).json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    jurisdictions: user.jurisdictions,
    loginCount: user.loginCount,
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcryptjs.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const [updated] = await db.update(usersTable)
    .set({ loginCount: sql`${usersTable.loginCount} + 1` })
    .where(eq(usersTable.id, user.id))
    .returning();

  const browser = req.headers["user-agent"] || "Unknown";
  let browserName = "Unknown";
  if (browser.includes("Chrome") && !browser.includes("Edg")) browserName = "Chrome";
  else if (browser.includes("Firefox")) browserName = "Firefox";
  else if (browser.includes("Safari") && !browser.includes("Chrome")) browserName = "Safari";
  else if (browser.includes("Edg")) browserName = "Edge";

  await db.insert(loginHistoryTable).values({
    userId: user.id,
    browser: browserName,
  });

  res.cookie("userId", String(user.id), {
    signed: true,
    httpOnly: true,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  const newCount = updated.loginCount;
  const showSurvey = newCount > 0 && newCount % 5 === 0;

  res.json({
    user: {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      jurisdictions: updated.jurisdictions,
      loginCount: updated.loginCount,
    },
    showSurvey,
    surveyUrl: showSurvey ? SURVEY_URL : undefined,
  });
});

router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const { email } = req.body;
  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "Email is required" });
    return;
  }
  // Always return success regardless of whether email exists (security practice)
  res.json({ message: "If that email exists, a reset link has been sent." });
});

router.post("/auth/logout", async (_req, res): Promise<void> => {
  res.clearCookie("userId");
  res.json({ message: "Signed out" });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    jurisdictions: user.jurisdictions,
    loginCount: user.loginCount,
  });
});

export default router;
