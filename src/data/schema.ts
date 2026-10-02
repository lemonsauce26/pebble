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

/** 조약돌을 담는 한 주. 나중에 기간 계산이 달라져도 흔들리지 않게 자기 기간을 직접 들고 있다. */
export const pocket = sqliteTable("pocket", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const stone = sqliteTable("stone", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  pocketId: text("pocket_id").notNull(),
  planId: text("plan_id"),
  title: text("title").notNull(),
  kind: text("kind", { enum: ["weekly", "daily", "weekly_n"] }).notNull(),
  weeklyNTarget: integer("weekly_n_target"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
