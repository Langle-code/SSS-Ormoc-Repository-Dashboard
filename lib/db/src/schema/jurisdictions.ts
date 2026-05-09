import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const jurisdictionsTable = pgTable("jurisdictions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  category: text("category").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertJurisdictionSchema = createInsertSchema(jurisdictionsTable).omit({ id: true, createdAt: true });
export type InsertJurisdiction = z.infer<typeof insertJurisdictionSchema>;
export type JurisdictionRecord = typeof jurisdictionsTable.$inferSelect;
