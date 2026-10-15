import { and, asc, eq } from "drizzle-orm";
import type { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type { Clock } from "@/ports/clock";

import { dailyDraw, dailyDrawStone, stone } from "./schema";

type Db = ExpoSQLiteDatabase<Record<string, unknown>> | BetterSQLite3Database<Record<string, unknown>>;

/** 하루에 뽑기는 하나뿐이라 날짜 하나로 찾는다. */
export function findDrawByDate(db: Db, userId: string, drawDate: string) {
  return db
    .select()
    .from(dailyDraw)
    .where(and(eq(dailyDraw.userId, userId), eq(dailyDraw.drawDate, drawDate)))
    .all()[0];
}

/** 뽑힌 순서가 아니라 주머니에 담은 순서로 보여준다. 결과는 `row.stone`에 들어 있다. */
export function selectDrawnStones(db: Db, drawId: string) {
  return db
    .select()
    .from(dailyDrawStone)
    .innerJoin(stone, eq(dailyDrawStone.stoneId, stone.id))
    .where(eq(dailyDrawStone.drawId, drawId))
    .orderBy(asc(stone.createdAt));
}

export function createDraw(
  db: Db,
  input: { userId: string; drawDate: string; pocketId: string; stoneIds: string[] },
  clock: Clock,
) {
  const now = clock.now();
  const row = {
    id: crypto.randomUUID(),
    userId: input.userId,
    drawDate: input.drawDate,
    pocketId: input.pocketId,
    rerollCount: 0,
    confirmedAt: null,
    restedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  db.insert(dailyDraw).values(row).run();

  for (const stoneId of input.stoneIds) {
    db.insert(dailyDrawStone)
      .values({ id: crypto.randomUUID(), drawId: row.id, stoneId, cantDoAt: null, createdAt: now })
      .run();
  }

  return row;
}
