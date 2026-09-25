import { describe, expect, it } from "vitest";
import type { Clock } from "@/ports/clock";
import { formatWeekLabel, getCurrentWeekRange } from "./week";

function fixedClock(isoDate: string): Clock {
  return { now: () => new Date(isoDate) };
}

describe("getCurrentWeekRange", () => {
  it("주 중간이면 그 주의 월요일부터 일요일까지를 준다", () => {
    expect(getCurrentWeekRange(fixedClock("2026-09-23T10:00:00"))).toEqual({
      startDate: "2026-09-21",
      endDate: "2026-09-27",
    });
  });

  it("월요일이면 그날이 시작일이다", () => {
    expect(getCurrentWeekRange(fixedClock("2026-09-21T00:00:00"))).toEqual({
      startDate: "2026-09-21",
      endDate: "2026-09-27",
    });
  });

  it("일요일이면 그 주의 마지막 날로 본다 (다음 주로 넘기지 않는다)", () => {
    expect(getCurrentWeekRange(fixedClock("2026-09-27T23:59:00"))).toEqual({
      startDate: "2026-09-21",
      endDate: "2026-09-27",
    });
  });

  it("주가 달을 넘어가도 이어진다", () => {
    expect(getCurrentWeekRange(fixedClock("2026-10-01T10:00:00"))).toEqual({
      startDate: "2026-09-28",
      endDate: "2026-10-04",
    });
  });

  it("주가 해를 넘어가도 이어진다", () => {
    expect(getCurrentWeekRange(fixedClock("2026-12-31T10:00:00"))).toEqual({
      startDate: "2026-12-28",
      endDate: "2027-01-03",
    });
  });
});

describe("formatWeekLabel", () => {
  it("'9월 21일 - 9월 27일' 형식으로 바꾼다", () => {
    expect(formatWeekLabel({ startDate: "2026-09-21", endDate: "2026-09-27" })).toBe(
      "9월 21일 - 9월 27일",
    );
  });

  it("달을 넘어가는 주는 양쪽 달을 모두 보여준다", () => {
    expect(formatWeekLabel({ startDate: "2026-09-28", endDate: "2026-10-04" })).toBe(
      "9월 28일 - 10월 4일",
    );
  });
});
