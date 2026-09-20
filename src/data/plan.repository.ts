import { and, eq } from "drizzle-orm";
import type { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { createPlan } from "@/domain/plan";
import type { Clock } from "@/ports/clock";

import { plan } from "./schema";

type PlanType = "year" | "month";
type Db = ExpoSQLiteDatabase<Record<string, unknown>> | BetterSQLite3Database<Record<string, unknown>>;

export class DuplicatePlanTitleError extends Error {
  constructor() {
    super("이미 같은 이름의 계획이 있습니다");
    this.name = "DuplicatePlanTitleError";
  }
}

export function selectPlans(db: Db, userId: string, type: PlanType, period: string) {
  return db
    .select()
    .from(plan)
    .where(and(eq(plan.userId, userId), eq(plan.type, type), eq(plan.period, period)));
}

export function insertPlan(
  db: Db,
  input: { userId: string; type: PlanType; period: string; title: string },
  clock: Clock,
) {
  const validated = createPlan(input.title);
  const now = clock.now();

  const row = {
    id: crypto.randomUUID(),
    userId: input.userId,
    type: input.type,
    period: input.period,
    title: validated.title,
    createdAt: now,
    updatedAt: now,
  };

  db.insert(plan).values(row).run();

  return row;
}
