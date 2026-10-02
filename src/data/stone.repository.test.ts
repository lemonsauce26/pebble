import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { beforeEach, describe, expect, it } from "vitest";
import type { Clock } from "@/ports/clock";

import * as schema from "./schema";
import { insertStone, selectStones, updateStone } from "./stone.repository";

function fixedClock(isoDate: string): Clock {
  return { now: () => new Date(isoDate) };
}

function makeTestDb() {
  const sqlite = new Database(":memory:");
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: "./src/data/migrations" });
  return db;
}

const clock = fixedClock("2026-09-25T10:00:00");

describe("stone.repository", () => {
  let db: ReturnType<typeof makeTestDb>;

  beforeEach(() => {
    db = makeTestDb();
  });

  it("담은 조약돌이 조회된다", () => {
    insertStone(
      db,
      {
        userId: "user-1",
        pocketId: "pocket-1",
        planId: "plan-1",
        title: "경력 한 줄 고치기",
        kind: "weekly",
      },
      clock,
    );

    const stones = selectStones(db, "pocket-1").all();

    expect(stones).toHaveLength(1);
    expect(stones[0].title).toBe("경력 한 줄 고치기");
    expect(stones[0].planId).toBe("plan-1");
    expect(stones[0].weeklyNTarget).toBeNull();
  });

  it("다른 주머니의 조약돌은 안 보인다", () => {
    insertStone(
      db,
      { userId: "user-1", pocketId: "pocket-1", planId: null, title: "지난주 것", kind: "weekly" },
      clock,
    );

    expect(selectStones(db, "pocket-2").all()).toHaveLength(0);
  });

  it("계획에 묶이지 않은 조약돌도 담을 수 있다", () => {
    const saved = insertStone(
      db,
      { userId: "user-1", pocketId: "pocket-1", planId: null, title: "서랍 정리", kind: "weekly" },
      clock,
    );

    expect(saved.planId).toBeNull();
  });

  it("주 N회는 목표 횟수가 함께 저장된다", () => {
    const saved = insertStone(
      db,
      {
        userId: "user-1",
        pocketId: "pocket-1",
        planId: null,
        title: "운동",
        kind: "weekly_n",
        weeklyNTarget: 3,
      },
      clock,
    );

    expect(saved.kind).toBe("weekly_n");
    expect(saved.weeklyNTarget).toBe(3);
  });

  it("담은 순서대로 조회된다", () => {
    insertStone(
      db,
      { userId: "user-1", pocketId: "pocket-1", planId: null, title: "첫째", kind: "weekly" },
      fixedClock("2026-09-25T10:00:00"),
    );
    insertStone(
      db,
      { userId: "user-1", pocketId: "pocket-1", planId: null, title: "둘째", kind: "weekly" },
      fixedClock("2026-09-25T10:05:00"),
    );

    expect(selectStones(db, "pocket-1").all().map((row) => row.title)).toEqual(["첫째", "둘째"]);
  });

  it("빈 제목은 거부한다", () => {
    expect(() =>
      insertStone(
        db,
        { userId: "user-1", pocketId: "pocket-1", planId: null, title: "   ", kind: "weekly" },
        clock,
      ),
    ).toThrow("조약돌 이름을 입력해주세요.");
  });

  it("주 N회인데 목표 횟수가 없으면 거부한다", () => {
    expect(() =>
      insertStone(
        db,
        { userId: "user-1", pocketId: "pocket-1", planId: null, title: "운동", kind: "weekly_n" },
        clock,
      ),
    ).toThrow("주 몇 번 할지 입력해주세요.");
  });

  it("제목을 고치면 반영된다", () => {
    const saved = insertStone(
      db,
      { userId: "user-1", pocketId: "pocket-1", planId: null, title: "운동", kind: "weekly" },
      clock,
    );

    const updated = updateStone(db, { id: saved.id, title: "가볍게 걷기", kind: "weekly" }, clock);

    expect(updated.title).toBe("가볍게 걷기");
    expect(selectStones(db, "pocket-1").all()[0].title).toBe("가볍게 걷기");
  });

  it("주간에서 주 N회로 바꾸면 목표 횟수가 생긴다", () => {
    const saved = insertStone(
      db,
      { userId: "user-1", pocketId: "pocket-1", planId: null, title: "운동", kind: "weekly" },
      clock,
    );

    const updated = updateStone(
      db,
      { id: saved.id, title: "운동", kind: "weekly_n", weeklyNTarget: 3 },
      clock,
    );

    expect(updated.kind).toBe("weekly_n");
    expect(updated.weeklyNTarget).toBe(3);
  });

  it("주 N회에서 주간으로 바꾸면 목표 횟수가 비워진다", () => {
    const saved = insertStone(
      db,
      {
        userId: "user-1",
        pocketId: "pocket-1",
        planId: null,
        title: "운동",
        kind: "weekly_n",
        weeklyNTarget: 3,
      },
      clock,
    );

    const updated = updateStone(db, { id: saved.id, title: "운동", kind: "weekly" }, clock);

    expect(updated.kind).toBe("weekly");
    expect(updated.weeklyNTarget).toBeNull();
  });

  it("고칠 때도 빈 제목은 거부한다", () => {
    const saved = insertStone(
      db,
      { userId: "user-1", pocketId: "pocket-1", planId: null, title: "운동", kind: "weekly" },
      clock,
    );

    expect(() => updateStone(db, { id: saved.id, title: "  ", kind: "weekly" }, clock)).toThrow(
      "조약돌 이름을 입력해주세요.",
    );
    expect(selectStones(db, "pocket-1").all()[0].title).toBe("운동");
  });

  it("없는 조약돌을 고치려 하면 거부한다", () => {
    expect(() =>
      updateStone(db, { id: "없는-아이디", title: "운동", kind: "weekly" }, clock),
    ).toThrow("고칠 조약돌을 찾지 못했습니다");
  });

  it("고치면 수정 시각이 갱신된다", () => {
    const saved = insertStone(
      db,
      { userId: "user-1", pocketId: "pocket-1", planId: null, title: "운동", kind: "weekly" },
      fixedClock("2026-09-25T10:00:00"),
    );

    const updated = updateStone(
      db,
      { id: saved.id, title: "운동하기", kind: "weekly" },
      fixedClock("2026-09-26T09:00:00"),
    );

    expect(updated.updatedAt.getTime()).toBeGreaterThan(saved.createdAt.getTime());
  });

  it("거부된 조약돌은 저장되지 않는다", () => {
    try {
      insertStone(
        db,
        { userId: "user-1", pocketId: "pocket-1", planId: null, title: "", kind: "weekly" },
        clock,
      );
    } catch {
      // 검증 실패는 여기서 확인할 대상이 아니다
    }

    expect(selectStones(db, "pocket-1").all()).toHaveLength(0);
  });
});
