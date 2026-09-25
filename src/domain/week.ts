import type { Clock } from "@/ports/clock";

export type WeekRange = { startDate: string; endDate: string };

function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDay(dateString: string): string {
  const month = Number(dateString.slice(5, 7));
  const day = Number(dateString.slice(8, 10));
  return `${month}월 ${day}일`;
}

export function getCurrentWeekRange(clock: Clock): WeekRange {
  const now = clock.now();
  // getDay()는 일요일이 0이다. 월요일을 주의 시작으로 쓰므로 한 칸씩 밀어서 센다.
  const daysSinceMonday = (now.getDay() + 6) % 7;

  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceMonday);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);

  return { startDate: toDateString(monday), endDate: toDateString(sunday) };
}

export function formatWeekLabel(range: WeekRange): string {
  return `${formatDay(range.startDate)} - ${formatDay(range.endDate)}`;
}
