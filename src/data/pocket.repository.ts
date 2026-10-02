import { and, eq, gte, lte } from "drizzle-orm";
import type { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type { WeekRange } from "@/domain/week";
import type { Clock } from "@/ports/clock";

import { pocket } from "./schema";

type Db = ExpoSQLiteDatabase<Record<string, unknown>> | BetterSQLite3Database<Record<string, unknown>>;

/** 날짜(YYYY-MM-DD)가 들어 있는 주머니. 주머니 기간은 서로 겹치지 않으므로 최대 하나다. */
export function findPocketContaining(db: Db, userId: string, date: string) {
  return db
    .select()
    .from(pocket)
    .where(and(eq(pocket.userId, userId), lte(pocket.startDate, date), gte(pocket.endDate, date)))
    .all()[0];
}

export function getOrCreatePocket(db: Db, userId: string, range: WeekRange, clock: Clock) {
  const existing = db
    .select()
    .from(pocket)
    .where(and(eq(pocket.userId, userId), eq(pocket.startDate, range.startDate)))
    .all()[0];

  if (existing) {
    return existing;
  }

  const now = clock.now();
  const row = {
    id: crypto.randomUUID(),
    userId,
    startDate: range.startDate,
    endDate: range.endDate,
    createdAt: now,
    updatedAt: now,
  };

  db.insert(pocket).values(row).run();

  return row;
}
