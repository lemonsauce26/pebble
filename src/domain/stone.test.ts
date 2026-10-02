import { describe, expect, it } from "vitest";
import { createStone } from "./stone";

describe("createStone", () => {
  it("제목 앞뒤 공백을 걷어낸다", () => {
    expect(createStone({ title: "  경력 한 줄 고치기  ", kind: "weekly" })).toEqual({
      title: "경력 한 줄 고치기",
      kind: "weekly",
      weeklyNTarget: null,
    });
  });

  it("제목이 비어 있으면 거부한다", () => {
    expect(() => createStone({ title: "   ", kind: "weekly" })).toThrow(
      "조약돌 이름을 입력해주세요.",
    );
  });

  it("매일 하는 조약돌도 만들 수 있다", () => {
    expect(createStone({ title: "영어 단어 외우기", kind: "daily" })).toEqual({
      title: "영어 단어 외우기",
      kind: "daily",
      weeklyNTarget: null,
    });
  });

  it("주 N회는 목표 횟수를 함께 가진다", () => {
    expect(createStone({ title: "운동", kind: "weekly_n", weeklyNTarget: 3 })).toEqual({
      title: "운동",
      kind: "weekly_n",
      weeklyNTarget: 3,
    });
  });

  it("주 N회인데 목표 횟수가 없으면 거부한다", () => {
    expect(() => createStone({ title: "운동", kind: "weekly_n" })).toThrow(
      "주 몇 번 할지 입력해주세요.",
    );
  });

  it("주 N회인데 목표 횟수가 0 이하면 거부한다", () => {
    expect(() => createStone({ title: "운동", kind: "weekly_n", weeklyNTarget: 0 })).toThrow(
      "주 몇 번 할지 입력해주세요.",
    );
  });

  it("주 N회의 목표 횟수는 정수여야 한다", () => {
    expect(() => createStone({ title: "운동", kind: "weekly_n", weeklyNTarget: 1.5 })).toThrow(
      "주 몇 번 할지 입력해주세요.",
    );
  });

  it("주 N회가 아닌데 목표 횟수가 들어오면 거부한다", () => {
    expect(() => createStone({ title: "운동", kind: "daily", weeklyNTarget: 3 })).toThrow(
      "이 종류에는 횟수를 정할 수 없습니다.",
    );
  });
});
