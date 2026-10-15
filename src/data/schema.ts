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

/**
 * 하루 한 번의 뽑기. 날짜는 새벽 1시 기준이라 밤 12시 30분은 아직 어제다.
 * 미완료 조약돌의 복귀는 따로 하는 일이 없다 — 날이 바뀌면 어제 뽑기를 더 이상 보지 않을 뿐이다.
 */
export const dailyDraw = sqliteTable("daily_draw", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  drawDate: text("draw_date").notNull(),
  pocketId: text("pocket_id").notNull(),
  rerollCount: integer("reroll_count").notNull().default(0),
  confirmedAt: integer("confirmed_at", { mode: "timestamp" }),
  restedAt: integer("rested_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const dailyDrawStone = sqliteTable("daily_draw_stone", {
  id: text("id").primaryKey(),
  drawId: text("draw_id").notNull(),
  stoneId: text("stone_id").notNull(),
  cantDoAt: integer("cant_do_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
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
