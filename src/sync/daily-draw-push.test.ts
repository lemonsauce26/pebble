import { describe, expect, it } from "vitest";
import type {
  DailyDrawRemote,
  RemoteDailyDrawRow,
  RemoteDailyDrawStoneRow,
} from "@/ports/daily-draw-remote";
import type { RemotePocketRow } from "@/ports/pocket-remote";

import { pushDailyDraw } from "./daily-draw-push";

type SavedInput = {
  pocket: RemotePocketRow;
  draw: RemoteDailyDrawRow;
  stones: RemoteDailyDrawStoneRow[];
};

function fakeRemote() {
  const saved: SavedInput[] = [];
  const remote: DailyDrawRemote = {
    saveDraw: async (input) => {
      saved.push(input);
    },
  };
  return { remote, saved };
}

const localPocket = {
  id: "pocket-1",
  userId: "user-1",
  startDate: "2026-10-19",
  endDate: "2026-10-25",
  createdAt: new Date("2026-10-19T00:00:00.000Z"),
  updatedAt: new Date("2026-10-19T00:00:00.000Z"),
};

const localDraw = {
  id: "draw-1",
  userId: "user-1",
  drawDate: "2026-10-21",
  pocketId: "pocket-1",
  rerollCount: 1,
  confirmedAt: null,
  restedAt: null,
  createdAt: new Date("2026-10-21T09:00:00.000Z"),
  updatedAt: new Date("2026-10-21T09:30:00.000Z"),
};

const localDrawStones = [
  {
    id: "ds-1",
    drawId: "draw-1",
    stoneId: "stone-1",
    cantDoAt: null,
    createdAt: new Date("2026-10-21T09:30:00.000Z"),
  },
];

describe("pushDailyDraw", () => {
  it("주머니·뽑기·뽑힌 조약돌을 한 번에 올린다", async () => {
    const { remote, saved } = fakeRemote();

    await pushDailyDraw(remote, localPocket, localDraw, localDrawStones);

    expect(saved).toHaveLength(1);
    expect(saved[0].pocket.id).toBe("pocket-1");
    expect(saved[0].draw).toEqual({
      id: "draw-1",
      user_id: "user-1",
      draw_date: "2026-10-21",
      pocket_id: "pocket-1",
      reroll_count: 1,
      confirmed_at: null,
      rested_at: null,
      created_at: "2026-10-21T09:00:00.000Z",
      updated_at: "2026-10-21T09:30:00.000Z",
    });
    expect(saved[0].stones).toEqual([
      {
        id: "ds-1",
        draw_id: "draw-1",
        stone_id: "stone-1",
        cant_do_at: null,
        created_at: "2026-10-21T09:30:00.000Z",
      },
    ]);
  });

  it("확정·쉼 시각이 있으면 함께 올라간다", async () => {
    const { remote, saved } = fakeRemote();

    await pushDailyDraw(
      remote,
      localPocket,
      {
        ...localDraw,
        confirmedAt: new Date("2026-10-21T10:00:00.000Z"),
        restedAt: new Date("2026-10-21T11:00:00.000Z"),
      },
      localDrawStones,
    );

    expect(saved[0].draw.confirmed_at).toBe("2026-10-21T10:00:00.000Z");
    expect(saved[0].draw.rested_at).toBe("2026-10-21T11:00:00.000Z");
  });

  it("업로드가 실패하면 에러를 그대로 던진다", async () => {
    const remote: DailyDrawRemote = {
      saveDraw: async () => {
        throw new Error("네트워크 오류");
      },
    };

    await expect(
      pushDailyDraw(remote, localPocket, localDraw, localDrawStones),
    ).rejects.toThrow("네트워크 오류");
  });
});
