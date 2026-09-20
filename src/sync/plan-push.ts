import type { PlanRemote } from "@/ports/plan-remote";

type LocalPlanRow = {
  id: string;
  userId: string;
  type: "year" | "month";
  period: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function pushPlan(remote: PlanRemote, row: LocalPlanRow): Promise<void> {
  await remote.upsertPlan({
    id: row.id,
    user_id: row.userId,
    type: row.type,
    period: row.period,
    title: row.title,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  });
}
