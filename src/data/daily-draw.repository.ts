import { and, asc, eq } from "drizzle-orm";
import type { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { remainingRerolls } from "@/domain/draw";
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

function findDrawById(db: Db, drawId: string) {
  const draw = db.select().from(dailyDraw).where(eq(dailyDraw.id, drawId)).all()[0];
  if (!draw) {
    throw new Error("뽑기를 찾지 못했습니다");
  }
  return draw;
}

function replaceDrawnStones(db: Db, drawId: string, stoneIds: string[], now: Date) {
  db.delete(dailyDrawStone).where(eq(dailyDrawStone.drawId, drawId)).run();

  for (const stoneId of stoneIds) {
    db.insert(dailyDrawStone)
      .values({ id: crypto.randomUUID(), drawId, stoneId, cantDoAt: null, createdAt: now })
      .run();
  }
}

/** 다시 뽑기는 새 기록을 만들지 않고 그날의 뽑기를 갈아끼운다. */
export function rerollDraw(db: Db, drawId: string, stoneIds: string[], clock: Clock) {
  const draw = findDrawById(db, drawId);

  if (draw.confirmedAt !== null) {
    throw new Error("이미 확정한 뽑기는 다시 뽑을 수 없어요");
  }
  if (remainingRerolls(draw.rerollCount) === 0) {
    throw new Error("다시 뽑기를 모두 썼어요");
  }

  const now = clock.now();
  replaceDrawnStones(db, drawId, stoneIds, now);
  db.update(dailyDraw)
    .set({ rerollCount: draw.rerollCount + 1, updatedAt: now })
    .where(eq(dailyDraw.id, drawId))
    .run();

  return findDrawById(db, drawId);
}

/** 에너지가 없는 날, 방치하고 도망가는 대신 당당하게 쉼을 선언한다. 되돌릴 수 있다. */
export function restDraw(db: Db, drawId: string, clock: Clock) {
  const draw = findDrawById(db, drawId);

  if (draw.confirmedAt !== null) {
    throw new Error("이미 확정한 날은 쉼으로 바꿀 수 없어요");
  }

  const now = clock.now();
  db.update(dailyDraw).set({ restedAt: now, updatedAt: now }).where(eq(dailyDraw.id, drawId)).run();

  return findDrawById(db, drawId);
}

export function cancelRest(db: Db, drawId: string, clock: Clock) {
  db.update(dailyDraw)
    .set({ restedAt: null, updatedAt: clock.now() })
    .where(eq(dailyDraw.id, drawId))
    .run();

  return findDrawById(db, drawId);
}

export function confirmDraw(db: Db, drawId: string, clock: Clock) {
  const now = clock.now();

  db.update(dailyDraw).set({ confirmedAt: now, updatedAt: now }).where(eq(dailyDraw.id, drawId)).run();

  return findDrawById(db, drawId);
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
  replaceDrawnStones(db, row.id, input.stoneIds, now);

  return row;
}
