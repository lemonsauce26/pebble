import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { beforeEach, describe, expect, it } from "vitest";
import type { Clock } from "@/ports/clock";

import * as schema from "./schema";
import { pocket } from "./schema";
import { findPocketContaining, getOrCreatePocket } from "./pocket.repository";

function fixedClock(isoDate: string): Clock {
  return { now: () => new Date(isoDate) };
}

function makeTestDb() {
  const sqlite = new Database(":memory:");
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: "./src/data/migrations" });
  return db;
}

const THIS_WEEK = { startDate: "2026-09-21", endDate: "2026-09-27" };
const NEXT_WEEK = { startDate: "2026-09-28", endDate: "2026-10-04" };

describe("pocket.repository", () => {
  let db: ReturnType<typeof makeTestDb>;
  const clock = fixedClock("2026-09-25T10:00:00");

  beforeEach(() => {
    db = makeTestDb();
  });

  it("주머니가 없으면 만들고, 기간을 그대로 저장한다", () => {
    const created = getOrCreatePocket(db, "user-1", THIS_WEEK, clock);

    expect(created.startDate).toBe("2026-09-21");
    expect(created.endDate).toBe("2026-09-27");
    expect(db.select().from(pocket).all()).toHaveLength(1);
  });

  it("같은 주를 다시 열면 새로 만들지 않고 같은 주머니를 준다", () => {
    const first = getOrCreatePocket(db, "user-1", THIS_WEEK, clock);
    const second = getOrCreatePocket(db, "user-1", THIS_WEEK, clock);

    expect(second.id).toBe(first.id);
    expect(db.select().from(pocket).all()).toHaveLength(1);
  });

  it("유저마다 자기 주머니를 가진다", () => {
    const mine = getOrCreatePocket(db, "user-1", THIS_WEEK, clock);
    const theirs = getOrCreatePocket(db, "user-2", THIS_WEEK, clock);

    expect(theirs.id).not.toBe(mine.id);
    expect(db.select().from(pocket).all()).toHaveLength(2);
  });

  it("기간 안의 날짜로 주머니를 찾는다", () => {
    const created = getOrCreatePocket(db, "user-1", THIS_WEEK, clock);

    expect(findPocketContaining(db, "user-1", "2026-09-24")?.id).toBe(created.id);
  });

  it("시작일과 끝일도 그 주머니에 포함된다", () => {
    const created = getOrCreatePocket(db, "user-1", THIS_WEEK, clock);

    expect(findPocketContaining(db, "user-1", "2026-09-21")?.id).toBe(created.id);
    expect(findPocketContaining(db, "user-1", "2026-09-27")?.id).toBe(created.id);
  });

  it("기간 밖의 날짜로는 찾지 못한다", () => {
    getOrCreatePocket(db, "user-1", THIS_WEEK, clock);

    expect(findPocketContaining(db, "user-1", "2026-09-20")).toBeUndefined();
    expect(findPocketContaining(db, "user-1", "2026-09-28")).toBeUndefined();
  });

  it("다른 유저의 주머니는 찾지 못한다", () => {
    getOrCreatePocket(db, "user-1", THIS_WEEK, clock);

    expect(findPocketContaining(db, "user-2", "2026-09-24")).toBeUndefined();
  });

  it("이어지는 두 주는 경계에서 겹치지 않는다", () => {
    const thisWeek = getOrCreatePocket(db, "user-1", THIS_WEEK, clock);
    const nextWeek = getOrCreatePocket(db, "user-1", NEXT_WEEK, clock);

    expect(findPocketContaining(db, "user-1", "2026-09-27")?.id).toBe(thisWeek.id);
    expect(findPocketContaining(db, "user-1", "2026-09-28")?.id).toBe(nextWeek.id);
  });
});
