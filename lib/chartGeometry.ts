/**
 * 간이 차트의 순수 로직 — SimpleChart(SVG 렌더링)에서 분리해 단위 테스트한다.
 */

/**
 * 항목명과 값을 인덱스를 맞춰 쌍으로 파싱한다. 값만 따로 걸러내면 잘못된 값
 * 하나 때문에 뒤의 항목명이 전부 엉뚱한 막대에 붙는 문제가 생기므로, 쌍 단위로
 * 유효성을 검사하고 못 읽은 쌍의 개수를 함께 돌려준다.
 */
export function parsePairs(labelsText: string, valuesText: string) {
  const labelTokens = labelsText.split(/[\n,]+/).map((s) => s.trim());
  const valueTokens = valuesText.split(/[\n,]+/).map((s) => s.trim());
  const n = Math.max(labelTokens.length, valueTokens.length);
  const labels: string[] = [];
  const values: number[] = [];
  let droppedCount = 0;
  for (let i = 0; i < n; i++) {
    const label = labelTokens[i] ?? "";
    const valueToken = valueTokens[i] ?? "";
    // 둘 다 비어 있으면 꼬리 구분자 등이므로 조용히 건너뛴다
    if (!label && !valueToken) continue;
    // Number("")===0 이라서 빈 토큰이 유령 0이 되는 것을 막기 위해 빈 값은 NaN 처리
    const v = valueToken === "" ? NaN : Number(valueToken);
    if (label && Number.isFinite(v)) {
      labels.push(label);
      values.push(v);
    } else {
      droppedCount++;
    }
  }
  return { labels, values, droppedCount };
}

function polarToXY(cx: number, cy: number, r: number, angle: number) {
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

export function arcPath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startAngle: number,
  endAngle: number,
) {
  const [x1, y1] = polarToXY(cx, cy, rOuter, startAngle);
  const [x2, y2] = polarToXY(cx, cy, rOuter, endAngle);
  const [x3, y3] = polarToXY(cx, cy, rInner, endAngle);
  const [x4, y4] = polarToXY(cx, cy, rInner, startAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  if (rInner === 0) {
    return `M ${cx} ${cy} L ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  }
  return `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${largeArc} 0 ${x4} ${y4} Z`;
}
