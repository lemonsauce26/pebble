import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { beforeEach, describe, expect, it } from "vitest";
import type { Clock } from "@/ports/clock";

import * as schema from "./schema";
import {
  confirmDraw,
  createDraw,
  findDrawByDate,
  rerollDraw,
  selectDrawnStones,
} from "./daily-draw.repository";
import { insertStone, selectStones } from "./stone.repository";

function fixedClock(isoDate: string): Clock {
  return { now: () => new Date(isoDate) };
}

function makeTestDb() {
  const sqlite = new Database(":memory:");
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: "./src/data/migrations" });
  return db;
}

const clock = fixedClock("2026-10-03T10:00:00");

describe("daily-draw.repository", () => {
  let db: ReturnType<typeof makeTestDb>;

  function seedStone(title: string, at: string) {
    return insertStone(
      db,
      { userId: "user-1", pocketId: "pocket-1", planId: null, title, kind: "weekly" },
      fixedClock(at),
    );
  }

  beforeEach(() => {
    db = makeTestDb();
  });

  it("뽑은 날짜로 다시 찾을 수 있다", () => {
    const first = seedStone("경력 한 줄 고치기", "2026-10-01T10:00:00");

    const draw = createDraw(
      db,
      { userId: "user-1", drawDate: "2026-10-03", pocketId: "pocket-1", stoneIds: [first.id] },
      clock,
    );

    expect(findDrawByDate(db, "user-1", "2026-10-03")?.id).toBe(draw.id);
  });

  it("다른 날짜로는 찾아지지 않는다", () => {
    const first = seedStone("경력 한 줄 고치기", "2026-10-01T10:00:00");
    createDraw(
      db,
      { userId: "user-1", drawDate: "2026-10-03", pocketId: "pocket-1", stoneIds: [first.id] },
      clock,
    );

    expect(findDrawByDate(db, "user-1", "2026-10-04")).toBeUndefined();
  });

  it("다른 유저의 뽑기는 보이지 않는다", () => {
    const first = seedStone("경력 한 줄 고치기", "2026-10-01T10:00:00");
    createDraw(
      db,
      { userId: "user-1", drawDate: "2026-10-03", pocketId: "pocket-1", stoneIds: [first.id] },
      clock,
    );

    expect(findDrawByDate(db, "user-2", "2026-10-03")).toBeUndefined();
  });

  it("뽑힌 조약돌을 주머니에 담은 순서대로 보여준다", () => {
    const first = seedStone("첫째", "2026-10-01T10:00:00");
    const second = seedStone("둘째", "2026-10-01T10:05:00");
    const third = seedStone("셋째", "2026-10-01T10:10:00");

    // 뽑힌 순서는 섞여 있어도 보여줄 때는 담은 순서를 따른다.
    const draw = createDraw(
      db,
      {
        userId: "user-1",
        drawDate: "2026-10-03",
        pocketId: "pocket-1",
        stoneIds: [third.id, first.id, second.id],
      },
      clock,
    );

    expect(selectDrawnStones(db, draw.id).all().map((row) => row.stone.title)).toEqual([
      "첫째",
      "둘째",
      "셋째",
    ]);
  });

  it("뽑지 않은 조약돌은 들어 있지 않다", () => {
    const first = seedStone("뽑힌 것", "2026-10-01T10:00:00");
    seedStone("안 뽑힌 것", "2026-10-01T10:05:00");

    const draw = createDraw(
      db,
      { userId: "user-1", drawDate: "2026-10-03", pocketId: "pocket-1", stoneIds: [first.id] },
      clock,
    );

    expect(selectDrawnStones(db, draw.id).all().map((row) => row.stone.title)).toEqual(["뽑힌 것"]);
  });

  it("뽑아도 조약돌은 주머니에 그대로 남는다 — 다음 날 평등하게 다시 후보가 된다", () => {
    const first = seedStone("어제 뽑혔던 것", "2026-10-01T10:00:00");
    const second = seedStone("어제 안 뽑힌 것", "2026-10-01T10:05:00");

    createDraw(
      db,
      { userId: "user-1", drawDate: "2026-10-02", pocketId: "pocket-1", stoneIds: [first.id] },
      fixedClock("2026-10-02T10:00:00"),
    );

    // 어제 뽑혔든 아니든 주머니 안에서는 구분이 없다. 미완료 표시도 남지 않는다.
    expect(selectStones(db, "pocket-1").all().map((row) => row.id)).toEqual([first.id, second.id]);
  });

  it("다시 뽑으면 조약돌이 바뀐다", () => {
    const first = seedStone("처음 뽑힌 것", "2026-10-01T10:00:00");
    const second = seedStone("다시 뽑힌 것", "2026-10-01T10:05:00");

    const draw = createDraw(
      db,
      { userId: "user-1", drawDate: "2026-10-03", pocketId: "pocket-1", stoneIds: [first.id] },
      clock,
    );
    rerollDraw(db, draw.id, [second.id], clock);

    expect(selectDrawnStones(db, draw.id).all().map((row) => row.stone.title)).toEqual([
      "다시 뽑힌 것",
    ]);
  });

  it("다시 뽑아도 그날의 뽑기 기록은 하나뿐이다", () => {
    const first = seedStone("조약돌", "2026-10-01T10:00:00");

    const draw = createDraw(
      db,
      { userId: "user-1", drawDate: "2026-10-03", pocketId: "pocket-1", stoneIds: [first.id] },
      clock,
    );
    const rerolled = rerollDraw(db, draw.id, [first.id], clock);

    expect(rerolled.id).toBe(draw.id);
    expect(findDrawByDate(db, "user-1", "2026-10-03")?.id).toBe(draw.id);
  });

  it("다시 뽑은 횟수가 쌓인다", () => {
    const first = seedStone("조약돌", "2026-10-01T10:00:00");

    const draw = createDraw(
      db,
      { userId: "user-1", drawDate: "2026-10-03", pocketId: "pocket-1", stoneIds: [first.id] },
      clock,
    );

    expect(rerollDraw(db, draw.id, [first.id], clock).rerollCount).toBe(1);
    expect(rerollDraw(db, draw.id, [first.id], clock).rerollCount).toBe(2);
  });

  it("다시 뽑기를 다 쓰면 거부한다", () => {
    const first = seedStone("조약돌", "2026-10-01T10:00:00");

    const draw = createDraw(
      db,
      { userId: "user-1", drawDate: "2026-10-03", pocketId: "pocket-1", stoneIds: [first.id] },
      clock,
    );
    rerollDraw(db, draw.id, [first.id], clock);
    rerollDraw(db, draw.id, [first.id], clock);

    expect(() => rerollDraw(db, draw.id, [first.id], clock)).toThrow("다시 뽑기를 모두 썼어요");
  });

  it("확정하면 확정 시각이 남는다", () => {
    const first = seedStone("조약돌", "2026-10-01T10:00:00");

    const draw = createDraw(
      db,
      { userId: "user-1", drawDate: "2026-10-03", pocketId: "pocket-1", stoneIds: [first.id] },
      clock,
    );

    expect(confirmDraw(db, draw.id, clock).confirmedAt).toEqual(new Date("2026-10-03T10:00:00"));
  });

  it("확정한 뒤에는 다시 뽑을 수 없다", () => {
    const first = seedStone("조약돌", "2026-10-01T10:00:00");

    const draw = createDraw(
      db,
      { userId: "user-1", drawDate: "2026-10-03", pocketId: "pocket-1", stoneIds: [first.id] },
      clock,
    );
    confirmDraw(db, draw.id, clock);

    expect(() => rerollDraw(db, draw.id, [first.id], clock)).toThrow(
      "이미 확정한 뽑기는 다시 뽑을 수 없어요",
    );
  });

  it("날이 바뀌면 어제 뽑기와 별개로 새 뽑기가 생긴다", () => {
    const first = seedStone("조약돌", "2026-10-01T10:00:00");

    const yesterday = createDraw(
      db,
      { userId: "user-1", drawDate: "2026-10-02", pocketId: "pocket-1", stoneIds: [first.id] },
      fixedClock("2026-10-02T10:00:00"),
    );
    const today = createDraw(
      db,
      { userId: "user-1", drawDate: "2026-10-03", pocketId: "pocket-1", stoneIds: [first.id] },
      clock,
    );

    expect(today.id).not.toBe(yesterday.id);
    expect(findDrawByDate(db, "user-1", "2026-10-02")?.id).toBe(yesterday.id);
    expect(findDrawByDate(db, "user-1", "2026-10-03")?.id).toBe(today.id);
  });
});
