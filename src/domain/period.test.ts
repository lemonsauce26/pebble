import { describe, expect, it } from "vitest";
import type { Clock } from "@/ports/clock";
import {
  formatPeriodLabel,
  getCurrentMonthPeriod,
  parseMonthPeriod,
  shiftMonthPeriod,
  toMonthPeriod,
} from "./period";

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

describe("parseMonthPeriod", () => {
  it("YYYYMM을 년/월 숫자로 쪼갠다", () => {
    expect(parseMonthPeriod("202609")).toEqual({ year: 2026, month: 9 });
  });

  it("10월 이상도 올바르게 쪼갠다", () => {
    expect(parseMonthPeriod("202612")).toEqual({ year: 2026, month: 12 });
  });
});

describe("toMonthPeriod", () => {
  it("년/월을 YYYYMM으로 합친다", () => {
    expect(toMonthPeriod(2026, 9)).toBe("202609");
  });

  it("한 자리 월은 앞에 0을 채운다", () => {
    expect(toMonthPeriod(2026, 1)).toBe("202601");
  });
});

describe("shiftMonthPeriod", () => {
  it("다음 달로 이동한다", () => {
    expect(shiftMonthPeriod("202609", 1)).toBe("202610");
  });

  it("이전 달로 이동한다", () => {
    expect(shiftMonthPeriod("202609", -1)).toBe("202608");
  });

  it("12월에서 다음 달로 가면 해가 바뀐다", () => {
    expect(shiftMonthPeriod("202612", 1)).toBe("202701");
  });

  it("1월에서 이전 달로 가면 해가 바뀐다", () => {
    expect(shiftMonthPeriod("202601", -1)).toBe("202512");
  });
});
