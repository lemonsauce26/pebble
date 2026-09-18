import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { beforeEach, describe, expect, it } from "vitest";

import * as schema from "./schema";
import { plan } from "./schema";
import { selectPlans } from "./plan.repository";

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
});
