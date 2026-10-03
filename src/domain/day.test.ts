import { describe, expect, it } from "vitest";
import type { Clock } from "@/ports/clock";
import { formatTodayLabel, getTodayKey } from "./day";

function fixedClock(isoDate: string): Clock {
  return { now: () => new Date(isoDate) };
}

describe("getTodayKey", () => {
  it("낮에는 그날 날짜를 준다", () => {
    expect(getTodayKey(fixedClock("2026-10-03T10:00:00"))).toBe("2026-10-03");
  });

  it("자정을 넘겨도 새벽 1시 전이면 아직 어제다", () => {
    expect(getTodayKey(fixedClock("2026-10-03T00:30:00"))).toBe("2026-10-02");
  });

  it("새벽 1시 정각부터 오늘이 된다", () => {
    expect(getTodayKey(fixedClock("2026-10-03T01:00:00"))).toBe("2026-10-03");
  });

  it("달이 바뀌는 새벽에도 어제로 본다", () => {
    expect(getTodayKey(fixedClock("2026-11-01T00:30:00"))).toBe("2026-10-31");
  });

  it("해가 바뀌는 새벽에도 어제로 본다", () => {
    expect(getTodayKey(fixedClock("2027-01-01T00:30:00"))).toBe("2026-12-31");
  });
});

describe("formatTodayLabel", () => {
  it("'10월 3일 토요일' 형식으로 바꾼다", () => {
    expect(formatTodayLabel("2026-10-03")).toBe("10월 3일 토요일");
  });

  it("월과 일이 한 자리여도 0을 붙이지 않는다", () => {
    expect(formatTodayLabel("2026-01-05")).toBe("1월 5일 월요일");
  });
});
