import { describe, expect, it } from "vitest";
import { createPlan } from "./plan";

describe("createPlan", () => {
  it("빈 제목이면 거부한다", () => {
    expect(() => createPlan("")).toThrow();
  });

  it("공백만 있으면 거부한다", () => {
    expect(() => createPlan("   ")).toThrow();
  });

  it("정상 제목은 앞뒤 공백을 지우고 통과시킨다", () => {
    expect(createPlan("  방 정리하기  ")).toEqual({ title: "방 정리하기" });
  });
});
