"use client";

import { useState } from "react";
import type { GuideStage } from "@/lib/guide";
import { toLocalDateKey } from "@/lib/activity";

type ExportableStage = Pick<
  GuideStage,
  "order" | "slug" | "title" | "checklist" | "selfCheck"
>;

function readLocal(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function buildMarkdown(stages: ExportableStage[]): string {
  const lines: string[] = [
    "# 내 연구 진행 노트",
    "",
    // toISOString은 UTC라 오전엔 어제 날짜가 찍힘 — 로컬 날짜로 표기
    `내보낸 날짜: ${toLocalDateKey(new Date())}`,
    "",
  ];

  for (const stage of stages) {
    lines.push(`## ${stage.order}. ${stage.title}`);

    const checkedRaw = readLocal(`research-guide:checklist:${stage.slug}`);
    let checked: boolean[] = [];
    try {
      // 화면 표시(ChecklistCard)와 동일하게, 길이가 맞는 배열만 인정한다
      const parsed = checkedRaw ? JSON.parse(checkedRaw) : null;
      if (Array.isArray(parsed) && parsed.length === stage.checklist.length) {
        checked = parsed;
      }
    } catch {
      checked = [];
    }
    if (stage.checklist.length > 0) {
      lines.push("", "**체크리스트**", "");
      stage.checklist.forEach((item, i) => {
        lines.push(`- [${checked[i] ? "x" : " "}] ${item}`);
      });
    }

    const reflection = readLocal(`research-guide:reflection:${stage.slug}`);
    if (stage.selfCheck.length > 0) {
      lines.push("", "**자가검증 질문**", "");
      stage.selfCheck.forEach((q) => lines.push(`- ${q}`));
      if (reflection?.trim()) {
        lines.push("", "**내 생각:**", "", reflection.trim());
      }
    }

    lines.push("");
  }

  return lines.join("\n");
}

export function PlanExport({ stages }: { stages: ExportableStage[] }) {
  const [exported, setExported] = useState(false);

  function handleExport() {
    const markdown = buildMarkdown(stages);
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "내-연구-진행-노트.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  }

  return (
    <section className="note-box mb-10 px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-ink">
            지금까지 기록 내보내기
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            각 단계에서 체크한 항목과 적어둔 생각을 파일 하나로 모아
            내려받습니다.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="shrink-0 rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-bg transition hover:opacity-85"
        >
          {exported ? "내려받음" : "마크다운으로 내보내기"}
        </button>
      </div>
    </section>
  );
}
