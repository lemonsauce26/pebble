import { DAY_BOUNDARY_HOUR } from "@/constants/draw";
import type { Clock } from "@/ports/clock";

const WEEKDAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** 오늘이 며칠인지. 새벽 1시 전이라면 아직 어제다. */
export function getTodayKey(clock: Clock): string {
  const shifted = new Date(clock.now().getTime() - DAY_BOUNDARY_HOUR * 60 * 60 * 1000);
  return toDateString(shifted);
}

export function formatTodayLabel(dateKey: string): string {
  const year = Number(dateKey.slice(0, 4));
  const month = Number(dateKey.slice(5, 7));
  const day = Number(dateKey.slice(8, 10));
  const weekday = WEEKDAY_NAMES[new Date(year, month - 1, day).getDay()];

  return `${month}월 ${day}일 ${weekday}요일`;
}
