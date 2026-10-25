import type { RemotePocketRow } from "./pocket-remote";
import { supabase } from "./supabase";

export type RemoteDailyDrawRow = {
  id: string;
  user_id: string;
  draw_date: string;
  pocket_id: string;
  reroll_count: number;
  confirmed_at: string | null;
  rested_at: string | null;
  created_at: string;
  updated_at: string;
};

export type RemoteDailyDrawStoneRow = {
  id: string;
  draw_id: string;
  stone_id: string;
  cant_do_at: string | null;
  created_at: string;
};

export interface DailyDrawRemote {
  /** 주머니·뽑기·뽑힌 조약돌을 한 덩어리로 저장한다. 중간에 실패하면 전부 되돌아간다. */
  saveDraw(input: {
    pocket: RemotePocketRow;
    draw: RemoteDailyDrawRow;
    stones: RemoteDailyDrawStoneRow[];
  }): Promise<void>;
}

export const supabaseDailyDrawRemote: DailyDrawRemote = {
  async saveDraw({ pocket, draw, stones }) {
    const { error } = await supabase.rpc("save_daily_draw", {
      p_pocket: pocket,
      p_draw: draw,
      p_stones: stones,
    });
    if (error) {
      throw new Error(error.message);
    }
  },
};
