/**
 * Fisher–Yates 셔플. `.sort(() => Math.random() - 0.5)`는 균등하지 않아서
 * (엔진의 정렬 알고리즘에 따라 특정 순열이 더 자주 나온다) 무작위 표집을
 * 가르치는 도구에서는 쓰면 안 된다. 원본은 건드리지 않고 복사본을 섞는다.
 */
export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
