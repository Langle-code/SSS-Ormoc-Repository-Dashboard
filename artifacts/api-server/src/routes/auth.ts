import { Router, type IRouter } from "express";
import bcryptjs from "bcryptjs";
import { db, usersTable, loginHistoryTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { randomBytes } from "crypto";
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
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcryptjs.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  await db.update(usersTable)
    .set({ loginCount: sql`${usersTable.loginCount} + 1` })
    .where(eq(usersTable.id, user.id));

  await db.insert(loginHistoryTable).values({ userId: user.id });

  res.cookie("userId", String(user.id), {
    signed: true,
    httpOnly: true,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    jurisdictions: user.jurisdictions,
    loginCount: user.loginCount + 1,
    surveyUrl: SURVEY_URL,
  });
});

router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const { email } = req.body;
  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim()));

  if (user) {
    const token = randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.update(usersTable)
      .set({ resetToken: token, resetTokenExpiry: expiry })
      .where(eq(usersTable.id, user.id));
  }

  // Always return success regardless of whether email exists (security practice)
  res.json({ message: "If that email exists, a reset link has been sent." });
});

router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const { token, password } = req.body;
  if (!token || typeof token !== "string") {
    res.status(400).json({ error: "Reset token is required" });
    return;
  }
  if (!password || typeof password !== "string" || password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.resetToken, token));
  if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
    res.status(400).json({ error: "Invalid or expired reset link. Please request a new one." });
    return;
  }

  const passwordHash = await bcryptjs.hash(password, 10);
  await db.update(usersTable)
    .set({ passwordHash, resetToken: null, resetTokenExpiry: null })
    .where(eq(usersTable.id, user.id));

  res.json({ message: "Password updated successfully. You can now sign in." });
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
