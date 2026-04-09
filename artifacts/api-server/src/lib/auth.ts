import { type Request, type Response, type NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!(req as any).session?.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!(req as any).session?.role || (req as any).session.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}
