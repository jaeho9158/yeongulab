/** 통계 계산기 결과 아래 고정으로 붙는 주의사항 — StatsCalculator에서 분리. */
export function CaveatBlock() {
  return (
    <ul className="mt-3 list-disc space-y-1 border-t border-line pl-5 pt-3 text-xs leading-relaxed text-ink-soft">
      <li>
        서로 독립된 두 집단이고 극단값이 없다는 전제입니다. 같은 사람을 두 번
        측정했다면(사전·사후) 대응표본 검정이 필요합니다.
      </li>
      <li>상관·회귀는 인과관계를 말해주지 않습니다.</li>
      <li>
        결과에는 효과크기(평균 차이·d 또는 R²)를 p값과 함께 적으세요.
      </li>
      <li>
        이 t-검정은 등분산을 가정하지 않는 Welch 방식이라 자유도(df)가
        소수로 나올 수 있습니다.
      </li>
      <li>p값은 차이의 크기나 중요성을 말해주지 않습니다.</li>
    </ul>
  );
}
