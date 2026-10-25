import type { RemotePocketRow } from "@/ports/pocket-remote";
import type { StoneRemote } from "@/ports/stone-remote";

type LocalPocketRow = {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  createdAt: Date;
  updatedAt: Date;
};

type LocalStoneRow = {
  id: string;
  userId: string;
  pocketId: string;
  planId: string | null;
  title: string;
  kind: "weekly" | "daily" | "weekly_n";
  weeklyNTarget: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export function toRemotePocket(row: LocalPocketRow): RemotePocketRow {
  return {
    id: row.id,
    user_id: row.userId,
    start_date: row.startDate,
    end_date: row.endDate,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

/** 조약돌은 주머니를 가리키므로 둘을 한 덩어리로 올린다. */
export async function pushStone(
  remote: StoneRemote,
  pocket: LocalPocketRow,
  row: LocalStoneRow,
): Promise<void> {
  await remote.saveStone({
    pocket: toRemotePocket(pocket),
    stone: {
      id: row.id,
      user_id: row.userId,
      pocket_id: row.pocketId,
      plan_id: row.planId,
      title: row.title,
      kind: row.kind,
      weekly_n_target: row.weeklyNTarget,
      created_at: row.createdAt.toISOString(),
      updated_at: row.updatedAt.toISOString(),
    },
  });
}

export async function pushStoneDeletion(remote: StoneRemote, id: string): Promise<void> {
  await remote.deleteStone(id);
}
