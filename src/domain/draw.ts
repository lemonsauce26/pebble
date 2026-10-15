import { REROLL_LIMIT } from "@/constants/draw";
import type { Random } from "@/ports/random";
import type { StoneKind } from "./stone";

export function remainingRerolls(rerollCount: number): number {
  return Math.max(0, REROLL_LIMIT - rerollCount);
}

/**
 * 뽑기 대상은 주간 조약돌뿐이다.
 * 매일·주 N회는 셔플 풀에서 완전히 빠지고 별도 영역에 상주한다 (기획서 7장).
 */
export function selectDrawCandidates<T extends { kind: StoneKind }>(stones: readonly T[]): T[] {
  return stones.filter((stone) => stone.kind === "weekly");
}

export function drawStones<T>(candidates: readonly T[], count: number, random: Random): T[] {
  const pool = [...candidates];
  const picked: T[] = [];
  const size = Math.min(count, pool.length);

  for (let index = 0; index < size; index += 1) {
    const [taken] = pool.splice(Math.floor(random.next() * pool.length), 1);
    picked.push(taken);
  }

  return picked;
}
