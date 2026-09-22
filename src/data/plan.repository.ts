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

/**
 * 같은 사람의 같은 기간(이번 달) 안에서만 이름 중복을 막는다. 다른 달은 같은 이름이어도 된다.
 * 수정할 때는 자기 자신(excludeId)은 중복에서 뺀다.
 */
function assertTitleNotDuplicated(
  db: Db,
  input: { userId: string; type: PlanType; period: string; title: string },
  excludeId?: string,
) {
  const sameTitle = db
    .select()
    .from(plan)
    .where(
      and(
        eq(plan.userId, input.userId),
        eq(plan.type, input.type),
        eq(plan.period, input.period),
        eq(plan.title, input.title),
      ),
    )
    .all();

  const conflicts = sameTitle.filter((row) => row.id !== excludeId);
  if (conflicts.length > 0) {
    throw new DuplicatePlanTitleError();
  }
}

export function insertPlan(
  db: Db,
  input: { userId: string; type: PlanType; period: string; title: string },
  clock: Clock,
) {
  const validated = createPlan(input.title);
  const now = clock.now();

  assertTitleNotDuplicated(db, { ...input, title: validated.title });

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

export function updatePlan(
  db: Db,
  input: { id: string; userId: string; type: PlanType; period: string; title: string },
  clock: Clock,
) {
  const validated = createPlan(input.title);
  const now = clock.now();

  assertTitleNotDuplicated(db, { ...input, title: validated.title }, input.id);

  db.update(plan)
    .set({
      type: input.type,
      period: input.period,
      title: validated.title,
      updatedAt: now,
    })
    .where(eq(plan.id, input.id))
    .run();

  const updated = db.select().from(plan).where(eq(plan.id, input.id)).all()[0];
  if (!updated) {
    throw new Error("수정할 계획을 찾지 못했습니다");
  }

  return updated;
}

export function deletePlan(db: Db, id: string) {
  db.delete(plan).where(eq(plan.id, id)).run();
}
