import type { RemotePocketRow } from "./pocket-remote";
import { supabase } from "./supabase";

export type RemoteStoneRow = {
  id: string;
  user_id: string;
  pocket_id: string;
  plan_id: string | null;
  title: string;
  kind: "weekly" | "daily" | "weekly_n";
  weekly_n_target: number | null;
  created_at: string;
  updated_at: string;
};

export interface StoneRemote {
  /** 주머니와 조약돌을 한 덩어리로 저장한다. 중간에 실패하면 둘 다 되돌아간다. */
  saveStone(input: { pocket: RemotePocketRow; stone: RemoteStoneRow }): Promise<void>;
  deleteStone(id: string): Promise<void>;
}

export const supabaseStoneRemote: StoneRemote = {
  async saveStone({ pocket, stone }) {
    const { error } = await supabase.rpc("save_stone_with_pocket", {
      p_pocket: pocket,
      p_stone: stone,
    });
    if (error) {
      throw new Error(error.message);
    }
  },

  async deleteStone(id) {
    const { error } = await supabase.from("stone").delete().eq("id", id);
    if (error) {
      throw new Error(error.message);
    }
  },
};
