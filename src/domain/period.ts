import type { Clock } from "@/ports/clock";

export function getCurrentMonthPeriod(clock: Clock): string {
  const now = clock.now();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}${month}`;
}

export function shiftMonthPeriod(period: string, delta: number): string {
  const year = Number(period.slice(0, 4));
  const month = Number(period.slice(4, 6));

  const shifted = new Date(year, month - 1 + delta, 1);
  const shiftedYear = shifted.getFullYear();
  const shiftedMonth = String(shifted.getMonth() + 1).padStart(2, "0");

  return `${shiftedYear}${shiftedMonth}`;
}

export function formatPeriodLabel(type: "year" | "month", period: string): string {
  if (type === "year") {
    return `${period}년`;
  }

  const year = period.slice(0, 4);
  const month = Number(period.slice(4, 6));
  return `${year}년 ${month}월`;
}
