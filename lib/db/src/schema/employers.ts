import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const employersTable = pgTable("employers", {
  id: serial("id").primaryKey(),
  employerId: text("employer_id").notNull(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  jurisdiction: text("jurisdiction").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertEmployerSchema = createInsertSchema(employersTable).omit({ id: true, createdAt: true });
export type InsertEmployer = z.infer<typeof insertEmployerSchema>;
export type Employer = typeof employersTable.$inferSelect;
