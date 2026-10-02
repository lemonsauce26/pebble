import { asc, eq } from "drizzle-orm";
import type { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { createStone, type StoneKind } from "@/domain/stone";
import type { Clock } from "@/ports/clock";

import { stone } from "./schema";

type Db = ExpoSQLiteDatabase<Record<string, unknown>> | BetterSQLite3Database<Record<string, unknown>>;

/** 주머니 안의 조약돌 전체. 계획별로 나누는 일은 화면에서 한다. */
export function selectStones(db: Db, pocketId: string) {
  return db.select().from(stone).where(eq(stone.pocketId, pocketId)).orderBy(asc(stone.createdAt));
}

export function insertStone(
  db: Db,
  input: {
    userId: string;
    pocketId: string;
    planId: string | null;
    title: string;
    kind: StoneKind;
    weeklyNTarget?: number | null;
  },
  clock: Clock,
) {
  const validated = createStone({
    title: input.title,
    kind: input.kind,
    weeklyNTarget: input.weeklyNTarget,
  });
  const now = clock.now();

  const row = {
    id: crypto.randomUUID(),
    userId: input.userId,
    pocketId: input.pocketId,
    planId: input.planId,
    title: validated.title,
    kind: validated.kind,
    weeklyNTarget: validated.weeklyNTarget,
    createdAt: now,
    updatedAt: now,
  };

  db.insert(stone).values(row).run();

  return row;
}
