export function createPlan(title: string): { title: string } {
  const trimmed = title.trim();
  if (trimmed.length === 0) {
    throw new Error("계획 이름을 입력해주세요.");
  }

  return { title: trimmed };
}
