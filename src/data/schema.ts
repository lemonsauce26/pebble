import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const plan = sqliteTable("plan", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type", { enum: ["year", "month"] }).notNull(),
  period: text("period").notNull(),
  title: text("title").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
