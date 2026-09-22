import { supabase } from "./supabase";

export type RemotePlanRow = {
  id: string;
  user_id: string;
  type: "year" | "month";
  period: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export interface PlanRemote {
  upsertPlan(row: RemotePlanRow): Promise<void>;
  deletePlan(id: string): Promise<void>;
}

export const supabasePlanRemote: PlanRemote = {
  async upsertPlan(row) {
    const { error } = await supabase.from("plan").upsert(row);
    if (error) {
      throw new Error(error.message);
    }
  },

  async deletePlan(id) {
    const { error } = await supabase.from("plan").delete().eq("id", id);
    if (error) {
      throw new Error(error.message);
    }
  },
};
