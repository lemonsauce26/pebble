export type StoneKind = "weekly" | "daily" | "weekly_n";

export type NewStone = {
  title: string;
  kind: StoneKind;
  weeklyNTarget: number | null;
};

export function createStone(input: {
  title: string;
  kind: StoneKind;
  weeklyNTarget?: number | null;
}): NewStone {
  const trimmed = input.title.trim();
  if (trimmed.length === 0) {
    throw new Error("조약돌 이름을 입력해주세요.");
  }

  if (input.kind !== "weekly_n") {
    if (input.weeklyNTarget !== undefined && input.weeklyNTarget !== null) {
      throw new Error("이 종류에는 횟수를 정할 수 없습니다.");
    }
    return { title: trimmed, kind: input.kind, weeklyNTarget: null };
  }

  const target = input.weeklyNTarget;
  if (target === undefined || target === null || !Number.isInteger(target) || target < 1) {
    throw new Error("주 몇 번 할지 입력해주세요.");
  }

  return { title: trimmed, kind: "weekly_n", weeklyNTarget: target };
}
