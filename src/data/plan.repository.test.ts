import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { beforeEach, describe, expect, it } from "vitest";
import type { Clock } from "@/ports/clock";

import * as schema from "./schema";
import { plan } from "./schema";
import { DuplicatePlanTitleError, insertPlan, selectPlans } from "./plan.repository";

function fixedClock(isoDate: string): Clock {
  return { now: () => new Date(isoDate) };
}

function makeTestDb() {
  const sqlite = new Database(":memory:");
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: "./src/data/migrations" });
  return db;
}

function seedPlan(
  db: ReturnType<typeof makeTestDb>,
  input: { id: string; userId: string; type: "year" | "month"; period: string; title: string },
) {
  const now = new Date();
  db.insert(plan)
    .values({ ...input, createdAt: now, updatedAt: now })
    .run();
}

describe("plan.repository", () => {
  let db: ReturnType<typeof makeTestDb>;

  beforeEach(() => {
    db = makeTestDb();
  });

  it("같은 유저·같은 type/period의 계획이 조회된다", () => {
    seedPlan(db, { id: "1", userId: "user-1", type: "month", period: "202609", title: "이력서 완성" });

    const plans = selectPlans(db, "user-1", "month", "202609").all();

    expect(plans).toHaveLength(1);
    expect(plans[0].title).toBe("이력서 완성");
  });

  it("다른 유저의 계획은 안 보인다", () => {
    seedPlan(db, { id: "1", userId: "user-1", type: "month", period: "202609", title: "이력서 완성" });

    const plans = selectPlans(db, "user-2", "month", "202609").all();

    expect(plans).toHaveLength(0);
  });

  it("다른 period의 계획은 안 보인다", () => {
    seedPlan(db, { id: "1", userId: "user-1", type: "month", period: "202608", title: "지난달 계획" });

    const plans = selectPlans(db, "user-1", "month", "202609").all();

    expect(plans).toHaveLength(0);
  });

  it("계획을 저장하면 같은 조건으로 조회된다", () => {
    insertPlan(
      db,
      { userId: "user-1", type: "month", period: "202609", title: "방 정리하기" },
      fixedClock("2026-09-19T10:00:00"),
    );

    const plans = selectPlans(db, "user-1", "month", "202609").all();

    expect(plans).toHaveLength(1);
    expect(plans[0].title).toBe("방 정리하기");
  });

  it("저장할 때 id와 시각이 채워진다", () => {
    insertPlan(
      db,
      { userId: "user-1", type: "month", period: "202609", title: "방 정리하기" },
      fixedClock("2026-09-19T10:00:00"),
    );

    const saved = selectPlans(db, "user-1", "month", "202609").all()[0];

    expect(saved.id).toBeTruthy();
    expect(saved.createdAt).toEqual(new Date("2026-09-19T10:00:00"));
    expect(saved.updatedAt).toEqual(new Date("2026-09-19T10:00:00"));
  });

  it("제목 앞뒤 공백은 지우고 저장한다", () => {
    insertPlan(
      db,
      { userId: "user-1", type: "month", period: "202609", title: "  방 정리하기  " },
      fixedClock("2026-09-19T10:00:00"),
    );

    const saved = selectPlans(db, "user-1", "month", "202609").all()[0];

    expect(saved.title).toBe("방 정리하기");
  });

  it("저장하면 저장된 행을 돌려준다", () => {
    const saved = insertPlan(
      db,
      { userId: "user-1", type: "month", period: "202609", title: "  방 정리하기  " },
      fixedClock("2026-09-19T10:00:00"),
    );

    expect(saved).toEqual({
      id: expect.any(String),
      userId: "user-1",
      type: "month",
      period: "202609",
      title: "방 정리하기",
      createdAt: new Date("2026-09-19T10:00:00"),
      updatedAt: new Date("2026-09-19T10:00:00"),
    });
  });

  it("빈 제목으로 저장하면 에러를 던진다", () => {
    expect(() =>
      insertPlan(
        db,
        { userId: "user-1", type: "month", period: "202609", title: "   " },
        fixedClock("2026-09-19T10:00:00"),
      ),
    ).toThrow();
  });

  describe("같은 달 중복 이름", () => {
    it("같은 달에 같은 이름이 이미 있으면 에러를 던진다", () => {
      insertPlan(
        db,
        { userId: "user-1", type: "month", period: "202609", title: "방 정리하기" },
        fixedClock("2026-09-19T10:00:00"),
      );

      expect(() =>
        insertPlan(
          db,
          { userId: "user-1", type: "month", period: "202609", title: "방 정리하기" },
          fixedClock("2026-09-19T11:00:00"),
        ),
      ).toThrow(DuplicatePlanTitleError);
    });

    it("앞뒤 공백만 다른 이름도 중복으로 본다", () => {
      insertPlan(
        db,
        { userId: "user-1", type: "month", period: "202609", title: "방 정리하기" },
        fixedClock("2026-09-19T10:00:00"),
      );

      expect(() =>
        insertPlan(
          db,
          { userId: "user-1", type: "month", period: "202609", title: "  방 정리하기  " },
          fixedClock("2026-09-19T11:00:00"),
        ),
      ).toThrow(DuplicatePlanTitleError);
    });

    it("같은 이름이라도 다른 달이면 저장된다", () => {
      insertPlan(
        db,
        { userId: "user-1", type: "month", period: "202609", title: "방 정리하기" },
        fixedClock("2026-09-19T10:00:00"),
      );

      expect(() =>
        insertPlan(
          db,
          { userId: "user-1", type: "month", period: "202610", title: "방 정리하기" },
          fixedClock("2026-10-01T10:00:00"),
        ),
      ).not.toThrow();

      expect(selectPlans(db, "user-1", "month", "202610").all()).toHaveLength(1);
    });

    it("같은 이름이라도 다른 유저면 저장된다", () => {
      insertPlan(
        db,
        { userId: "user-1", type: "month", period: "202609", title: "방 정리하기" },
        fixedClock("2026-09-19T10:00:00"),
      );

      expect(() =>
        insertPlan(
          db,
          { userId: "user-2", type: "month", period: "202609", title: "방 정리하기" },
          fixedClock("2026-09-19T11:00:00"),
        ),
      ).not.toThrow();

      expect(selectPlans(db, "user-2", "month", "202609").all()).toHaveLength(1);
    });
  });
});
