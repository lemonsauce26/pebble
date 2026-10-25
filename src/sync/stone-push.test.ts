import { describe, expect, it } from "vitest";
import type { RemotePocketRow } from "@/ports/pocket-remote";
import type { RemoteStoneRow, StoneRemote } from "@/ports/stone-remote";

import { pushStone, pushStoneDeletion } from "./stone-push";

function fakeRemote() {
  const saved: { pocket: RemotePocketRow; stone: RemoteStoneRow }[] = [];
  const deleted: string[] = [];
  const remote: StoneRemote = {
    saveStone: async (input) => {
      saved.push(input);
    },
    deleteStone: async (id) => {
      deleted.push(id);
    },
  };
  return { remote, saved, deleted };
}

const localPocket = {
  id: "pocket-1",
  userId: "user-1",
  startDate: "2026-10-19",
  endDate: "2026-10-25",
  createdAt: new Date("2026-10-19T00:00:00.000Z"),
  updatedAt: new Date("2026-10-19T00:00:00.000Z"),
};

const localStone = {
  id: "stone-1",
  userId: "user-1",
  pocketId: "pocket-1",
  planId: "plan-1",
  title: "경력 한 줄 고치기",
  kind: "weekly" as const,
  weeklyNTarget: null,
  createdAt: new Date("2026-10-21T10:00:00.000Z"),
  updatedAt: new Date("2026-10-21T10:00:00.000Z"),
};

describe("pushStone", () => {
  it("주머니와 조약돌을 한 번에 올린다", async () => {
    const { remote, saved } = fakeRemote();

    await pushStone(remote, localPocket, localStone);

    expect(saved).toHaveLength(1);
    expect(saved[0].pocket).toEqual({
      id: "pocket-1",
      user_id: "user-1",
      start_date: "2026-10-19",
      end_date: "2026-10-25",
      created_at: "2026-10-19T00:00:00.000Z",
      updated_at: "2026-10-19T00:00:00.000Z",
    });
    expect(saved[0].stone).toEqual({
      id: "stone-1",
      user_id: "user-1",
      pocket_id: "pocket-1",
      plan_id: "plan-1",
      title: "경력 한 줄 고치기",
      kind: "weekly",
      weekly_n_target: null,
      created_at: "2026-10-21T10:00:00.000Z",
      updated_at: "2026-10-21T10:00:00.000Z",
    });
  });

  it("계획에 묶이지 않은 조약돌은 plan_id가 비어서 올라간다", async () => {
    const { remote, saved } = fakeRemote();

    await pushStone(remote, localPocket, { ...localStone, planId: null });

    expect(saved[0].stone.plan_id).toBeNull();
  });

  it("주 N회는 목표 횟수가 함께 올라간다", async () => {
    const { remote, saved } = fakeRemote();

    await pushStone(remote, localPocket, {
      ...localStone,
      kind: "weekly_n",
      weeklyNTarget: 3,
    });

    expect(saved[0].stone.weekly_n_target).toBe(3);
  });

  it("업로드가 실패하면 에러를 그대로 던진다", async () => {
    const remote: StoneRemote = {
      saveStone: async () => {
        throw new Error("네트워크 오류");
      },
      deleteStone: async () => {},
    };

    await expect(pushStone(remote, localPocket, localStone)).rejects.toThrow("네트워크 오류");
  });
});

describe("pushStoneDeletion", () => {
  it("삭제할 id를 클라우드에 전달한다", async () => {
    const { remote, deleted } = fakeRemote();

    await pushStoneDeletion(remote, "stone-1");

    expect(deleted).toEqual(["stone-1"]);
  });
});
