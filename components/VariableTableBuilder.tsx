"use client";

import { useState } from "react";
import { usePersistentState } from "@/lib/usePersistentState";
import { COPY_FAILED_MESSAGE } from "@/lib/clipboard";

type Row = { name: string; role: "독립변수" | "종속변수" | "통제변수"; note: string };

const ROLES: Row["role"][] = ["독립변수", "종속변수", "통제변수"];

export function VariableTableBuilder() {
  const [rows, setRows] = usePersistentState<Row[]>("variable-table", [
    { name: "", role: "독립변수", note: "" },
  ]);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  function update(i: number, patch: Partial<Row>) {
    setRows(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows([...rows, { name: "", role: "종속변수", note: "" }]);
  }

  function removeRow(i: number) {
    setRows(rows.filter((_, idx) => idx !== i));
  }

  const filled = rows.filter((r) => r.name.trim());

  async function copyTable() {
    if (filled.length === 0) return;
    const header = "| 변수명 | 구분 | 설명/측정 방법 |\n|---|---|---|";
    const body = filled
      .map((r) => `| ${r.name} | ${r.role} | ${r.note} |`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(`${header}\n${body}`);
      setCopyFailed(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 조용히 넘기면 사용자가 복사된 줄 알고 이전 클립보드 내용을 붙여넣는다
      setCopyFailed(true);
    }
  }

  return (
    <section className="card mt-10 px-5 py-5 sm:px-6 sm:py-6">
      <h2 className="text-lg font-bold text-ink">변수 정의표 만들기</h2>
      <p className="mt-1 text-sm text-ink-soft">
        독립변수·종속변수·통제변수를 정리하면 표 형태(마크다운)로 복사할 수
        있습니다.
      </p>

      <div className="mt-4 space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex flex-wrap items-start gap-2">
            <input
              value={row.name}
              onChange={(e) => update(i, { name: e.target.value })}
              placeholder="변수명 (예: 조명 세기)"
              aria-label={`${i + 1}번째 변수 이름`}
              className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:border-accent"
            />
            <select
              value={row.role}
              onChange={(e) =>
                update(i, { role: e.target.value as Row["role"] })
              }
              aria-label={`${i + 1}번째 변수 구분`}
              className="rounded-lg border border-line bg-bg px-2 py-2 text-sm text-ink focus:border-accent"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <input
              value={row.note}
              onChange={(e) => update(i, { note: e.target.value })}
              placeholder="설명/측정 방법"
              aria-label={`${i + 1}번째 변수 설명/측정 방법`}
              className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:border-accent"
            />
            <button
              type="button"
              onClick={() => removeRow(i)}
              className="rounded-lg px-2 py-2 text-xs text-ink-soft hover:text-ink"
              aria-label="행 삭제"
            >
              삭제
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={addRow}
          className="rounded-lg border border-line px-4 py-2 text-xs font-medium text-ink-soft hover:border-accent hover:text-ink"
        >
          + 변수 추가
        </button>
        <button
          type="button"
          onClick={copyTable}
          disabled={filled.length === 0}
          className="rounded-lg bg-ink px-4 py-2 text-xs font-medium text-bg transition hover:opacity-85 disabled:opacity-50"
        >
          {copied ? "복사됨" : "표로 복사하기"}
        </button>
      </div>
      <p aria-live="polite" className="mt-2 text-xs text-ink-soft">
        {copyFailed && COPY_FAILED_MESSAGE}
      </p>
    </section>
  );
}
