import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { employersTable } from "./employers";

export const documentsTable = pgTable("documents", {
  id: serial("id").primaryKey(),
  formName: text("form_name").notNull(),
  formType: text("form_type").notNull().default("R1/R1A"),
  employerId: integer("employer_id").notNull().references(() => employersTable.id, { onDelete: "cascade" }),
  jurisdiction: text("jurisdiction").notNull(),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  status: text("status").notNull().default("pending"),
  uploadedBy: integer("uploaded_by").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDocumentSchema = createInsertSchema(documentsTable).omit({ id: true, createdAt: true, status: true });
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documentsTable.$inferSelect;
