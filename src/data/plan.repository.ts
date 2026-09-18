import { and, eq } from "drizzle-orm";
import type { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

import { plan } from "./schema";

type PlanType = "year" | "month";
type Db = ExpoSQLiteDatabase<Record<string, unknown>> | BetterSQLite3Database<Record<string, unknown>>;

export function selectPlans(db: Db, userId: string, type: PlanType, period: string) {
  return db
    .select()
    .from(plan)
    .where(and(eq(plan.userId, userId), eq(plan.type, type), eq(plan.period, period)));
}
