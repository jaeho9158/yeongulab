"use client";

import { useState } from "react";

type ChartType = "bar" | "hbar" | "line" | "area" | "scatter" | "pie" | "donut";

const CHART_OPTIONS: { type: ChartType; label: string }[] = [
  { type: "bar", label: "막대" },
  { type: "hbar", label: "가로막대" },
  { type: "line", label: "선" },
  { type: "area", label: "영역" },
  { type: "scatter", label: "산점도" },
  { type: "pie", label: "원형" },
  { type: "donut", label: "도넛" },
];

const XY_TYPES: ChartType[] = ["bar", "hbar", "line", "area", "scatter"];
const SHARE_TYPES: ChartType[] = ["pie", "donut"];

const W = 640;
const H = 340;
const PAD = { top: 24, right: 24, bottom: 48, left: 56 };
const COLORS = [
  "#2f6f4f",
  "#4a90c2",
  "#c2794a",
  "#8b5fbf",
  "#c24a6b",
  "#b8a020",
  "#4ab8b0",
  "#6b7076",
];

function parsePairs(labelsText: string, valuesText: string) {
  const labels = labelsText
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const values = valuesText
    .split(/[\n,]+/)
    .map((s) => Number(s.trim()))
    .filter((n) => !Number.isNaN(n));
  const n = Math.min(labels.length, values.length);
  return { labels: labels.slice(0, n), values: values.slice(0, n) };
}

function polarToXY(cx: number, cy: number, r: number, angle: number) {
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

function arcPath(
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

export function SimpleChart() {
  const [type, setType] = useState<ChartType>("bar");
  const [labelsText, setLabelsText] = useState("A, B, C, D");
  const [valuesText, setValuesText] = useState("12, 19, 7, 15");
  const [xTitle, setXTitle] = useState("");
  const [yTitle, setYTitle] = useState("");

  const { labels, values } = parsePairs(labelsText, valuesText);
  const hasData = labels.length >= 2;

  const maxV = hasData ? Math.max(...values, 0) : 0;
  const minV = hasData ? Math.min(...values, 0) : 0;
  const range = maxV - minV || 1;
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  function yFor(v: number) {
    return PAD.top + plotH - ((v - minV) / range) * plotH;
  }
  function xForIndex(i: number) {
    return PAD.left + (plotW / Math.max(labels.length - 1, 1)) * i;
  }
  const barWidth = hasData ? plotW / labels.length / 1.6 : 0;
  const barSlot = hasData ? plotW / labels.length : 0;

  const total = values.reduce((s, v) => s + Math.max(v, 0), 0);

  function downloadSvg() {
    const svg = document.getElementById("simple-chart-svg");
    if (!svg) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob(
      [`<?xml version="1.0" standalone="no"?>\n${source}`],
      { type: "image/svg+xml;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chart.svg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <section className="card mt-10 px-5 py-5 sm:px-6 sm:py-6">
      <h2 className="text-lg font-bold text-ink">간이 차트 그리기</h2>
      <p className="mt-1 text-sm text-ink-soft">
        항목명과 값만 넣으면 논문에 바로 붙일 수 있는 SVG 그래프를 만들어
        줍니다.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {CHART_OPTIONS.map((opt) => (
          <button
            key={opt.type}
            type="button"
            onClick={() => setType(opt.type)}
            className={`rounded-full px-4 py-2 text-xs font-medium ${
              type === opt.type
                ? "bg-ink text-bg"
                : "border border-line text-ink-soft"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-ink-soft">
            {SHARE_TYPES.includes(type) ? "항목 이름" : "항목 이름 (쉼표로 구분)"}
          </label>
          <textarea
            value={labelsText}
            onChange={(e) => setLabelsText(e.target.value)}
            rows={2}
            className="mt-1 w-full resize-y rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-accent"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-ink-soft">
            값 (같은 개수로)
          </label>
          <textarea
            value={valuesText}
            onChange={(e) => setValuesText(e.target.value)}
            rows={2}
            className="mt-1 w-full resize-y rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-accent"
          />
        </div>
        {XY_TYPES.includes(type) && (
          <>
            <div>
              <label className="text-xs font-medium text-ink-soft">
                {type === "hbar" ? "값 축 제목 (선택)" : "X축 제목 (선택)"}
              </label>
              <input
                value={xTitle}
                onChange={(e) => setXTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-accent"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-soft">
                {type === "hbar" ? "항목 축 제목 (선택)" : "Y축 제목 (선택)"}
              </label>
              <input
                value={yTitle}
                onChange={(e) => setYTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-accent"
              />
            </div>
          </>
        )}
      </div>

      {hasData ? (
        <div className="mt-4">
          <div className="overflow-x-auto rounded-lg border border-line bg-bg p-2">
            <svg
              id="simple-chart-svg"
              viewBox={`0 0 ${W} ${H}`}
              width="100%"
              style={{ maxWidth: W, display: "block" }}
              role="img"
              aria-label={`${CHART_OPTIONS.find((o) => o.type === type)?.label}그래프`}
            >
              <rect width={W} height={H} fill="white" />

              {/* ---- 좌표축형 차트 (bar/hbar/line/area/scatter) ---- */}
              {type === "bar" && (
                <>
                  {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                    const v = minV + range * t;
                    const y = yFor(v);
                    return (
                      <g key={t}>
                        <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="#e6e7e9" />
                        <text x={PAD.left - 8} y={y} textAnchor="end" dominantBaseline="middle" fontSize="11" fill="#6b7076">
                          {v.toFixed(1)}
                        </text>
                      </g>
                    );
                  })}
                  {values.map((v, i) => {
                    const x = PAD.left + barSlot * i + (barSlot - barWidth) / 2;
                    const y = yFor(Math.max(v, 0));
                    const yZero = yFor(0);
                    return (
                      <rect key={i} x={x} y={Math.min(y, yZero)} width={barWidth} height={Math.abs(yZero - y) || 1} fill={COLORS[0]} />
                    );
                  })}
                  {labels.map((label, i) => (
                    <text key={label + i} x={PAD.left + barSlot * i + barSlot / 2} y={H - PAD.bottom + 20} textAnchor="middle" fontSize="11" fill="#17181a">
                      {label}
                    </text>
                  ))}
                </>
              )}

              {type === "hbar" && (() => {
                const hPlotW = W - PAD.left - PAD.right;
                const hMax = Math.max(...values, 0.0001);
                const slotH = plotH / labels.length;
                const barH = slotH / 1.6;
                return (
                  <>
                    {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                      const x = PAD.left + hPlotW * t;
                      return (
                        <g key={t}>
                          <line x1={x} x2={x} y1={PAD.top} y2={H - PAD.bottom} stroke="#e6e7e9" />
                          <text x={x} y={H - PAD.bottom + 16} textAnchor="middle" fontSize="11" fill="#6b7076">
                            {(hMax * t).toFixed(1)}
                          </text>
                        </g>
                      );
                    })}
                    {values.map((v, i) => (
                      <rect key={i} x={PAD.left} y={PAD.top + slotH * i + (slotH - barH) / 2} width={(v / hMax) * hPlotW} height={barH} fill={COLORS[0]} />
                    ))}
                    {labels.map((label, i) => (
                      <text key={label + i} x={PAD.left - 8} y={PAD.top + slotH * i + slotH / 2} textAnchor="end" dominantBaseline="middle" fontSize="11" fill="#17181a">
                        {label}
                      </text>
                    ))}
                  </>
                );
              })()}

              {(type === "line" || type === "area" || type === "scatter") && (
                <>
                  {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                    const v = minV + range * t;
                    const y = yFor(v);
                    return (
                      <g key={t}>
                        <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="#e6e7e9" />
                        <text x={PAD.left - 8} y={y} textAnchor="end" dominantBaseline="middle" fontSize="11" fill="#6b7076">
                          {v.toFixed(1)}
                        </text>
                      </g>
                    );
                  })}
                  {type === "area" && (
                    <polygon
                      points={`${xForIndex(0)},${yFor(0)} ${values.map((v, i) => `${xForIndex(i)},${yFor(v)}`).join(" ")} ${xForIndex(values.length - 1)},${yFor(0)}`}
                      fill={COLORS[0]}
                      opacity={0.25}
                    />
                  )}
                  {(type === "line" || type === "area") && (
                    <polyline
                      points={values.map((v, i) => `${xForIndex(i)},${yFor(v)}`).join(" ")}
                      fill="none"
                      stroke={COLORS[0]}
                      strokeWidth={2}
                    />
                  )}
                  {values.map((v, i) => (
                    <circle key={i} cx={xForIndex(i)} cy={yFor(v)} r={type === "scatter" ? 5 : 3.5} fill={COLORS[0]} />
                  ))}
                  {labels.map((label, i) => (
                    <text key={label + i} x={xForIndex(i)} y={H - PAD.bottom + 20} textAnchor="middle" fontSize="11" fill="#17181a">
                      {label}
                    </text>
                  ))}
                </>
              )}

              {XY_TYPES.includes(type) && xTitle && (
                <text x={PAD.left + plotW / 2} y={H - 6} textAnchor="middle" fontSize="12" fill="#6b7076">
                  {xTitle}
                </text>
              )}
              {XY_TYPES.includes(type) && yTitle && (
                <text x={14} y={PAD.top + plotH / 2} textAnchor="middle" fontSize="12" fill="#6b7076" transform={`rotate(-90, 14, ${PAD.top + plotH / 2})`}>
                  {yTitle}
                </text>
              )}

              {/* ---- 비중형 차트 (pie/donut) ---- */}
              {SHARE_TYPES.includes(type) && (() => {
                const cx = W / 2 - 60;
                const cy = H / 2;
                const rOuter = Math.min(plotH, plotW) / 2 - 10;
                const rInner = type === "donut" ? rOuter * 0.55 : 0;
                let angle = -Math.PI / 2;
                return (
                  <>
                    {values.map((v, i) => {
                      const frac = Math.max(v, 0) / (total || 1);
                      const start = angle;
                      const end = angle + frac * Math.PI * 2;
                      angle = end;
                      return (
                        <path
                          key={i}
                          d={arcPath(cx, cy, rOuter, rInner, start, end)}
                          fill={COLORS[i % COLORS.length]}
                        />
                      );
                    })}
                    {labels.map((label, i) => {
                      const legendY = PAD.top + i * 22;
                      return (
                        <g key={label + i}>
                          <rect x={W - 170} y={legendY} width={12} height={12} fill={COLORS[i % COLORS.length]} />
                          <text x={W - 152} y={legendY + 10} fontSize="12" fill="#17181a">
                            {label} ({total ? ((Math.max(values[i], 0) / total) * 100).toFixed(0) : 0}%)
                          </text>
                        </g>
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          </div>
          <button
            type="button"
            onClick={downloadSvg}
            className="mt-3 rounded-lg border border-line px-4 py-2 text-xs font-medium text-ink-soft hover:border-accent hover:text-ink"
          >
            SVG로 내려받기
          </button>
        </div>
      ) : (
        <p className="mt-4 text-sm text-ink-soft">
          항목 2개 이상, 값도 같은 개수로 입력해주세요.
        </p>
      )}
    </section>
  );
}
