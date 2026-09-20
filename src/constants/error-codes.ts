/**
 * DB 작업 실패 시 사용자에게 보여줄 오류 코드.
 * 앞 두 자리 = 기능 영역, 뒤 두 자리 = 개별 오류.
 *
 * 01xx 계획(plan) / 02xx 조약돌(stone, 예정) / 99xx 알 수 없는 오류
 */
export const ERROR_CODES = {
  PLAN_INSERT_FAILED: "0101",
  PLAN_DUPLICATE_TITLE: "0102",
  PLAN_CLOUD_PUSH_FAILED: "0103",
  UNKNOWN: "9999",
} as const;
