"use client";

import { useSeededState } from "@/lib/useSeededState";
import { toLocalDateKey } from "@/lib/activity";
import { readChecklist } from "@/lib/checklist";

type StageForPrint = {
  order: number;
  slug: string;
  title: string;
  checklist: string[];
  selfCheck: string[];
};

function readReflection(slug: string): string {
  try {
    return window.localStorage.getItem(`research-guide:reflection:${slug}`) ?? "";
  } catch {
    return "";
  }
}

export function PrintableChecklist({ stages }: { stages: StageForPrint[] }) {
  // 인쇄일은 렌더 중 new Date()를 쓰면 서버/클라이언트가 달라지므로 hydration 뒤에 채운다
  const [seeded] = useSeededState(() => {
    const checked: Record<string, boolean[]> = {};
    const reflections: Record<string, string> = {};
    for (const stage of stages) {
      checked[stage.slug] = readChecklist(stage.slug, stage.checklist);
      reflections[stage.slug] = readReflection(stage.slug);
    }
    return {
      checkedByStage: checked,
      reflectionByStage: reflections,
      printedOn: toLocalDateKey(new Date()),
    };
  });
  const hydrated = seeded !== null;
  const checkedByStage = seeded?.checkedByStage ?? {};
  const reflectionByStage = seeded?.reflectionByStage ?? {};
  const printedOn = seeded?.printedOn ?? "";

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 print:max-w-none print:px-0 print:py-0">
      <div className="flex items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-ink">인쇄용 진행 노트</h1>
          <p className="mt-1 text-sm text-ink-soft">
            체크리스트 완료 여부와 자가검증 메모를 한 장으로 모았습니다. 아래
            버튼으로 인쇄하거나 PDF로 저장하세요.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="shrink-0 rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-bg transition hover:opacity-85"
        >
          인쇄하기
        </button>
      </div>

      <div className="hidden print:block">
        <h1 className="text-xl font-bold">내 연구 진행 노트</h1>
        {printedOn && (
          <p className="mt-1 text-xs text-ink-soft">인쇄일: {printedOn}</p>
        )}
      </div>

      <div className="mt-8 space-y-8 print:mt-4 print:space-y-6">
        {stages.map((stage) => {
          const checked = hydrated
            ? (checkedByStage[stage.slug] ??
              Array(stage.checklist.length).fill(false))
            : Array(stage.checklist.length).fill(false);
          const reflection = reflectionByStage[stage.slug] ?? "";

          return (
            <section key={stage.slug} className="break-inside-avoid">
              <h2 className="text-lg font-bold text-ink">
                {stage.order}. {stage.title}
              </h2>

              {stage.checklist.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {stage.checklist.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span aria-hidden className="mt-0.5 shrink-0">
                        {checked[i] ? "☑" : "☐"}
                      </span>
                      <span
                        className={
                          checked[i]
                            ? "text-ink-soft line-through"
                            : "text-ink"
                        }
                      >
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {stage.selfCheck.length > 0 && (
                <div className="mt-3 rounded-lg bg-surface px-3 py-2 print:rounded-none print:bg-transparent print:border print:border-line">
                  <p className="text-xs font-medium text-ink-soft">
                    자가검증 질문
                  </p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-ink-soft">
                    {stage.selfCheck.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                  {reflection.trim() && (
                    <p className="mt-2 text-sm text-ink whitespace-pre-wrap">
                      {reflection.trim()}
                    </p>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
