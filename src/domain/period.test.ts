import { describe, expect, it } from "vitest";
import type { Clock } from "@/ports/clock";
import { formatPeriodLabel, getCurrentMonthPeriod } from "./period";

function fixedClock(isoDate: string): Clock {
  return { now: () => new Date(isoDate) };
}

describe("getCurrentMonthPeriod", () => {
  it("현재 날짜를 YYYYMM 형식으로 반환한다", () => {
    expect(getCurrentMonthPeriod(fixedClock("2026-09-17T10:00:00"))).toBe("202609");
  });

  it("월이 한 자리여도 앞에 0을 채운다", () => {
    expect(getCurrentMonthPeriod(fixedClock("2026-01-05T10:00:00"))).toBe("202601");
  });
});

describe("formatPeriodLabel", () => {
  it("month 타입은 '2026년 9월' 형식으로 바꾼다", () => {
    expect(formatPeriodLabel("month", "202609")).toBe("2026년 9월");
  });

  it("year 타입은 '2026년' 형식으로 바꾼다", () => {
    expect(formatPeriodLabel("year", "2026")).toBe("2026년");
  });
});
