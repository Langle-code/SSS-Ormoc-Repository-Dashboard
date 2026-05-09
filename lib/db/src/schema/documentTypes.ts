import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";

export const documentTypesTable = pgTable("document_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DocumentType = typeof documentTypesTable.$inferSelect;
