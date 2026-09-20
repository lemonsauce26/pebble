import { describe, expect, it } from "vitest";
import type { PlanRemote, RemotePlanRow } from "@/ports/plan-remote";

import { pushPlan } from "./plan-push";

function fakeRemote() {
  const upserted: RemotePlanRow[] = [];
  const remote: PlanRemote = {
    upsertPlan: async (row) => {
      upserted.push(row);
    },
  };
  return { remote, upserted };
}

const localRow = {
  id: "plan-1",
  userId: "user-1",
  type: "month" as const,
  period: "202609",
  title: "방 정리하기",
  createdAt: new Date("2026-09-19T10:00:00.000Z"),
  updatedAt: new Date("2026-09-19T10:00:00.000Z"),
};

describe("pushPlan", () => {
  it("로컬 행을 클라우드 형식으로 바꿔서 올린다", async () => {
    const { remote, upserted } = fakeRemote();

    await pushPlan(remote, localRow);

    expect(upserted).toHaveLength(1);
    expect(upserted[0]).toEqual({
      id: "plan-1",
      user_id: "user-1",
      type: "month",
      period: "202609",
      title: "방 정리하기",
      created_at: "2026-09-19T10:00:00.000Z",
      updated_at: "2026-09-19T10:00:00.000Z",
    });
  });

  it("업로드가 실패하면 에러를 그대로 던진다", async () => {
    const remote: PlanRemote = {
      upsertPlan: async () => {
        throw new Error("네트워크 오류");
      },
    };

    await expect(pushPlan(remote, localRow)).rejects.toThrow("네트워크 오류");
  });
});
