import type { DailyDrawRemote } from "@/ports/daily-draw-remote";

import { toRemotePocket } from "./stone-push";

type LocalPocketRow = {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  createdAt: Date;
  updatedAt: Date;
};

type LocalDailyDrawRow = {
  id: string;
  userId: string;
  drawDate: string;
  pocketId: string;
  rerollCount: number;
  confirmedAt: Date | null;
  restedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type LocalDailyDrawStoneRow = {
  id: string;
  drawId: string;
  stoneId: string;
  cantDoAt: Date | null;
  createdAt: Date;
};

/** 주머니·뽑기·뽑힌 조약돌을 한 덩어리로 올린다. 중간에 끊겨도 반쪽만 남지 않는다. */
export async function pushDailyDraw(
  remote: DailyDrawRemote,
  pocket: LocalPocketRow,
  draw: LocalDailyDrawRow,
  drawStones: LocalDailyDrawStoneRow[],
): Promise<void> {
  await remote.saveDraw({
    pocket: toRemotePocket(pocket),
    draw: {
      id: draw.id,
      user_id: draw.userId,
      draw_date: draw.drawDate,
      pocket_id: draw.pocketId,
      reroll_count: draw.rerollCount,
      confirmed_at: draw.confirmedAt?.toISOString() ?? null,
      rested_at: draw.restedAt?.toISOString() ?? null,
      created_at: draw.createdAt.toISOString(),
      updated_at: draw.updatedAt.toISOString(),
    },
    stones: drawStones.map((row) => ({
      id: row.id,
      draw_id: row.drawId,
      stone_id: row.stoneId,
      cant_do_at: row.cantDoAt?.toISOString() ?? null,
      created_at: row.createdAt.toISOString(),
    })),
  });
}
