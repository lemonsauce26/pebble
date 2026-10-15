import { describe, expect, it } from "vitest";
import type { Random } from "@/ports/random";
import { drawStones, remainingRerolls, selectDrawCandidates } from "./draw";

/** 정해진 순서대로 난수를 돌려주는 가짜. 뽑기 결과를 단정할 수 있게 한다. */
function fixedRandom(values: number[]): Random {
  let index = 0;
  return { next: () => values[index++] };
}

describe("selectDrawCandidates", () => {
  it("주간 조약돌만 뽑기 후보가 된다", () => {
    const stones = [
      { id: "1", kind: "weekly" as const },
      { id: "2", kind: "daily" as const },
      { id: "3", kind: "weekly_n" as const },
      { id: "4", kind: "weekly" as const },
    ];

    expect(selectDrawCandidates(stones).map((stone) => stone.id)).toEqual(["1", "4"]);
  });

  it("주간 조약돌이 하나도 없으면 후보가 없다", () => {
    const stones = [{ id: "1", kind: "daily" as const }];

    expect(selectDrawCandidates(stones)).toEqual([]);
  });
});

describe("remainingRerolls", () => {
  it("아직 다시 뽑지 않았으면 두 번 남는다", () => {
    expect(remainingRerolls(0)).toBe(2);
  });

  it("쓸수록 줄어든다", () => {
    expect(remainingRerolls(1)).toBe(1);
    expect(remainingRerolls(2)).toBe(0);
  });

  it("음수로는 내려가지 않는다", () => {
    expect(remainingRerolls(3)).toBe(0);
  });
});

describe("drawStones", () => {
  it("후보 중에서 정해진 개수만큼 뽑는다", () => {
    const picked = drawStones(["a", "b", "c", "d"], 3, fixedRandom([0, 0, 0]));

    expect(picked).toHaveLength(3);
  });

  it("같은 조약돌을 두 번 뽑지 않는다", () => {
    const picked = drawStones(["a", "b", "c", "d"], 3, fixedRandom([0, 0, 0]));

    expect(new Set(picked).size).toBe(3);
  });

  it("난수가 정해져 있으면 결과도 정해진다", () => {
    // 0.99 → d, 0 → a, 0.5 → c
    const picked = drawStones(["a", "b", "c", "d"], 3, fixedRandom([0.99, 0, 0.5]));

    expect(picked).toEqual(["d", "a", "c"]);
  });

  it("후보가 뽑을 개수보다 적으면 있는 만큼만 뽑는다", () => {
    const picked = drawStones(["a", "b"], 3, fixedRandom([0, 0]));

    expect(picked).toEqual(["a", "b"]);
  });

  it("후보가 없으면 빈 손으로 돌아온다", () => {
    expect(drawStones([], 3, fixedRandom([0]))).toEqual([]);
  });

  it("원래 후보 목록을 건드리지 않는다", () => {
    const candidates = ["a", "b", "c"];

    drawStones(candidates, 2, fixedRandom([0, 0]));

    expect(candidates).toEqual(["a", "b", "c"]);
  });
});
