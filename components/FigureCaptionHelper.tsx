"use client";

import { useState } from "react";
import { usePersistentState } from "@/lib/usePersistentState";

const CAPTION_FORMAT_RE = /^(Figure|Fig\.|Table|그림|표)\s*\d+[.:]/;

export function FigureCaptionHelper() {
  const [form, setForm] = usePersistentState<{
    kind: "Figure" | "Table";
    number: string;
    desc: string;
    checkText: string;
  }>("figure-caption", {
    kind: "Figure",
    number: "1",
    desc: "",
    checkText: "",
  });
  const { kind, number, desc, checkText } = form;
  const [copied, setCopied] = useState(false);
  const [checked, setChecked] = useState(false);

  const assembled = desc ? `${kind} ${number}. ${desc}` : "";

  async function copy() {
    if (!assembled) return;
    try {
      await navigator.clipboard.writeText(assembled);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 접근 실패 시 무시
    }
  }

  const formatOk = CAPTION_FORMAT_RE.test(checkText.trim());

  return (
    <section className="card mt-10 px-5 py-5 sm:px-6 sm:py-6">
      <h2 className="text-lg font-bold text-ink">그림·표 캡션 도우미</h2>
      <p className="mt-1 text-sm text-ink-soft">
        캡션을 만들거나, 이미 쓴 캡션의 형식이 표준에 맞는지 확인합니다.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-[auto_auto_1fr]">
        <div>
          <label htmlFor="caption-kind" className="text-xs font-medium text-ink-soft">
            종류
          </label>
          <select
            id="caption-kind"
            value={kind}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                kind: e.target.value as "Figure" | "Table",
              }))
            }
            className="mt-1 block rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-accent"
          >
            <option value="Figure">Figure</option>
            <option value="Table">Table</option>
          </select>
        </div>
        <div>
          <label htmlFor="caption-number" className="text-xs font-medium text-ink-soft">
            번호
          </label>
          <input
            id="caption-number"
            value={number}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, number: e.target.value }))
            }
            className="mt-1 block w-16 rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink focus:border-accent"
          />
        </div>
        <div className="min-w-0">
          <label htmlFor="caption-desc" className="text-xs font-medium text-ink-soft">
            설명
          </label>
          <input
            id="caption-desc"
            value={desc}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, desc: e.target.value }))
            }
            placeholder="설명 (예: 조건별 성장 속도 비교)"
            className="mt-1 block w-full min-w-0 rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink placeholder:text-ink-soft/70 focus:border-accent"
          />
        </div>
      </div>

      {assembled && (
        <div className="mt-3 rounded-lg bg-surface px-4 py-3">
          <p className="text-sm text-ink">{assembled}</p>
          <button
            type="button"
            onClick={copy}
            className="-mx-1 mt-1.5 -mb-2 px-3 py-2 text-xs text-ink-soft hover:text-ink"
          >
            {copied ? "복사됨" : "복사"}
          </button>
        </div>
      )}

      <div className="mt-6 border-t border-line pt-4">
        <label htmlFor="caption-check" className="text-xs font-medium text-ink-soft">
          이미 쓴 캡션 형식 확인하기
        </label>
        <div className="mt-1 flex flex-wrap gap-2">
          <input
            id="caption-check"
            value={checkText}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, checkText: e.target.value }));
              setChecked(false);
            }}
            placeholder="예: 그림 1. 조건별 성장 속도 비교"
            className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink placeholder:text-ink-soft/70 focus:border-accent"
          />
          <button
            type="button"
            onClick={() => setChecked(true)}
            disabled={!checkText.trim()}
            className="rounded-lg border border-line px-4 py-2 text-xs font-medium text-ink-soft hover:border-accent hover:text-ink disabled:opacity-50"
          >
            확인
          </button>
        </div>
        {checked && (
          <p className="mt-2 text-xs text-ink-soft">
            {formatOk
              ? "✓ \"Figure 1.\" / \"그림 1.\" 같은 표준 형식으로 시작합니다."
              : "✗ \"Figure 1. 설명\" 또는 \"그림 1. 설명\" 형식으로 시작하는지 확인해보세요."}
          </p>
        )}
      </div>
    </section>
  );
}
