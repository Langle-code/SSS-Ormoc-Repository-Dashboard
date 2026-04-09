import { type Request, type Response, type NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

declare global {
  namespace Express {
    interface Request {
      session?: {
        userId: number;
        role: string;
        jurisdictions: string[];
      };
    }
  }
}

export async function sessionMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const userId = req.signedCookies?.["userId"];
  if (userId) {
    const id = parseInt(userId, 10);
    if (!isNaN(id)) {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
      if (user) {
        req.session = {
          userId: user.id,
          role: user.role,
          jurisdictions: user.jurisdictions,
        };
      }
    }
  }
  next();
}
