import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const loginHistoryTable = pgTable("login_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  browser: text("browser").notNull().default("Unknown"),
  loginAt: timestamp("login_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLoginHistorySchema = createInsertSchema(loginHistoryTable).omit({ id: true, loginAt: true });
export type InsertLoginHistory = z.infer<typeof insertLoginHistorySchema>;
export type LoginHistory = typeof loginHistoryTable.$inferSelect;
