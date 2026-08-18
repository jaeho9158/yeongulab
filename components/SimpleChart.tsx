"use client";

import { useState } from "react";

type ChartType = "bar" | "line";

const W = 640;
const H = 340;
const PAD = { top: 24, right: 24, bottom: 48, left: 56 };

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

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => setType("bar")}
          className={`rounded-full px-4 py-2 text-xs font-medium ${
            type === "bar" ? "bg-ink text-bg" : "border border-line text-ink-soft"
          }`}
        >
          막대그래프
        </button>
        <button
          type="button"
          onClick={() => setType("line")}
          className={`rounded-full px-4 py-2 text-xs font-medium ${
            type === "line" ? "bg-ink text-bg" : "border border-line text-ink-soft"
          }`}
        >
          선그래프
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-ink-soft">
            항목 이름 (쉼표로 구분)
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
        <div>
          <label className="text-xs font-medium text-ink-soft">
            X축 제목 (선택)
          </label>
          <input
            value={xTitle}
            onChange={(e) => setXTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-accent"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-ink-soft">
            Y축 제목 (선택)
          </label>
          <input
            value={yTitle}
            onChange={(e) => setYTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-accent"
          />
        </div>
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
              aria-label={`${type === "bar" ? "막대" : "선"}그래프`}
            >
              <rect width={W} height={H} fill="white" />
              {/* y축 그리드/라벨 */}
              {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                const v = minV + range * t;
                const y = yFor(v);
                return (
                  <g key={t}>
                    <line
                      x1={PAD.left}
                      x2={W - PAD.right}
                      y1={y}
                      y2={y}
                      stroke="#e6e7e9"
                    />
                    <text
                      x={PAD.left - 8}
                      y={y}
                      textAnchor="end"
                      dominantBaseline="middle"
                      fontSize="11"
                      fill="#6b7076"
                    >
                      {v.toFixed(1)}
                    </text>
                  </g>
                );
              })}

              {/* 데이터 */}
              {type === "bar"
                ? values.map((v, i) => {
                    const x = PAD.left + barSlot * i + (barSlot - barWidth) / 2;
                    const y = yFor(Math.max(v, 0));
                    const yZero = yFor(0);
                    const height = Math.abs(yZero - y);
                    return (
                      <rect
                        key={i}
                        x={x}
                        y={Math.min(y, yZero)}
                        width={barWidth}
                        height={height || 1}
                        fill="#2f6f4f"
                      />
                    );
                  })
                : (
                    <polyline
                      points={values
                        .map((v, i) => `${xForIndex(i)},${yFor(v)}`)
                        .join(" ")}
                      fill="none"
                      stroke="#2f6f4f"
                      strokeWidth={2}
                    />
                  )}
              {type === "line" &&
                values.map((v, i) => (
                  <circle
                    key={i}
                    cx={xForIndex(i)}
                    cy={yFor(v)}
                    r={3.5}
                    fill="#2f6f4f"
                  />
                ))}

              {/* x축 라벨 */}
              {labels.map((label, i) => (
                <text
                  key={label + i}
                  x={
                    type === "bar"
                      ? PAD.left + barSlot * i + barSlot / 2
                      : xForIndex(i)
                  }
                  y={H - PAD.bottom + 20}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#17181a"
                >
                  {label}
                </text>
              ))}

              {xTitle && (
                <text
                  x={PAD.left + plotW / 2}
                  y={H - 6}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#6b7076"
                >
                  {xTitle}
                </text>
              )}
              {yTitle && (
                <text
                  x={14}
                  y={PAD.top + plotH / 2}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#6b7076"
                  transform={`rotate(-90, 14, ${PAD.top + plotH / 2})`}
                >
                  {yTitle}
                </text>
              )}
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
