export interface Random {
  /** 0 이상 1 미만의 수. */
  next(): number;
}

export const systemRandom: Random = {
  next: () => Math.random(),
};
