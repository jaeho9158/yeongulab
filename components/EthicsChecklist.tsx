"use client";

import { useEffect, useState } from "react";
import { logActivity } from "@/lib/activity";

function storageKey(slug: string) {
  return `research-guide:ethics:${slug}`;
}

type ChecklistItem = {
  label: string;
  hint: string;
};

type ChecklistCategory = {
  title: string;
  items: ChecklistItem[];
};

const CATEGORIES: ChecklistCategory[] = [
  {
    title: "연구윤리",
    items: [
      {
        label:
          "사람 대상 설문/실험이라면 참여자에게 연구 목적을 설명하고 동의를 구했는가",
        hint: "미성년자 참여자라면 보호자 동의가 필요한지 확인해보세요.",
      },
      {
        label:
          "수집한 개인정보(이름, 연락처 등)를 최소화하고 익명/가명 처리했는가",
        hint: "꼭 필요한 정보만 모으고, 분석·발표 시에는 개인을 특정할 수 없게 처리하세요.",
      },
      {
        label: "참여자가 언제든 참여를 철회할 수 있다는 점을 안내했는가",
        hint: "설문/실험 시작 전에 중간에 그만둬도 불이익이 없다는 점을 알려주세요.",
      },
      {
        label: "동물이나 위험 물질을 다루는 실험이라면 관련 안전수칙을 확인했는가",
        hint: "학교 안전 지침이나 지도교사의 확인을 미리 받아두세요.",
      },
      {
        label: "타인의 저작물(이미지, 텍스트, 데이터)을 사용했다면 출처를 명시했는가",
        hint: "직접 만들지 않은 자료는 출처와 저작권 조건을 함께 적어두세요.",
      },
    ],
  },
  {
    title: "재현가능성",
    items: [
      {
        label:
          "실험/조사 방법을 다른 사람이 그대로 따라 할 수 있을 만큼 구체적으로 기술했는가",
        hint: "사용한 도구, 절차, 조건(장소, 시간, 환경 등)을 빠짐없이 적어보세요.",
      },
      {
        label: "사용한 데이터나 코드를 정리해서 남겨두었는가",
        hint: "나중에 스스로도 다시 확인할 수 있도록 원본 데이터와 분석 과정을 보관하세요.",
      },
      {
        label: "표본 크기, 측정 방법, 통계 분석 방법을 명시했는가",
        hint: "몇 명/몇 개를 대상으로 어떻게 측정하고 분석했는지 구체적으로 적어보세요.",
      },
      {
        label: "예외적으로 제외한 데이터가 있다면 그 기준을 명시했는가",
        hint: "이상치나 불성실 응답을 제외했다면 어떤 기준으로 제외했는지 적어두세요.",
      },
    ],
  },
  {
    title: "인용 형식",
    items: [
      {
        label: "본문에서 인용한 모든 문헌이 참고문헌 목록에 빠짐없이 있는가",
        hint: "본문 인용과 참고문헌 목록을 한 번씩 대조해보세요.",
      },
      {
        label: "인용 형식(APA 등)을 일관되게 사용했는가",
        hint: "저자, 연도, 제목 표기 방식을 문헌 전체에 동일하게 맞춰보세요.",
      },
    ],
  },
];

const TOTAL_ITEMS = CATEGORIES.reduce((sum, c) => sum + c.items.length, 0);

// 카테고리별 시작 인덱스(누적) — 렌더 중 변수를 증가시키지 않고 평탄 인덱스를 구한다
const OFFSETS = CATEGORIES.reduce<number[]>((acc, c, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + CATEGORIES[i - 1].items.length);
  return acc;
}, []);

export function EthicsChecklist({
  slug,
  title = "연구윤리 · 재현가능성 체크리스트",
}: {
  slug: string;
  title?: string;
}) {
  const [checked, setChecked] = useState<boolean[]>(() =>
    Array(TOTAL_ITEMS).fill(false),
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey(slug));
      if (raw) {
        const saved = JSON.parse(raw) as boolean[];
        if (Array.isArray(saved) && saved.length === TOTAL_ITEMS) {
          setChecked(saved);
        }
      }
    } catch {
      // localStorage 접근 불가(프라이빗 모드 등) — 기본값으로 진행
    }
    setHydrated(true);
  }, [slug]);

  function toggle(index: number) {
    const wasChecked = checked[index] ?? false;
    const next = checked.map((v, i) => (i === index ? !v : v));
    setChecked(next);
    try {
      window.localStorage.setItem(storageKey(slug), JSON.stringify(next));
    } catch {
      // 저장 실패해도 화면 상태는 유지
    }
    if (!wasChecked) {
      logActivity({ type: "STAGE_ITEM_DONE", refId: `${slug}:ethics:${index}` });
    }
  }

  const doneCount = checked.filter(Boolean).length;

  return (
    <section className="card mt-10 px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-ink">{title}</h2>
        <span className="text-xs text-ink-soft" suppressHydrationWarning>
          {hydrated ? `${doneCount} / ${TOTAL_ITEMS} 확인` : ""}
        </span>
      </div>
      <p className="mt-1 text-xs text-ink-soft">
        이 기기의 브라우저에만 저장됩니다. 참고용 자가점검이며, 모두 체크해야
        하는 것은 아닙니다.
      </p>

      <div className="mt-4 space-y-6">
        {CATEGORIES.map((category, ci) => (
          <div key={category.title}>
            <h3 className="text-sm font-semibold text-ink">
              {category.title}
            </h3>
            <ul className="mt-2 space-y-2">
              {category.items.map((item, ii) => {
                const index = OFFSETS[ci] + ii;
                return (
                  <li key={index}>
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2.5 hover:bg-surface">
                      <input
                        type="checkbox"
                        checked={checked[index] ?? false}
                        onChange={() => toggle(index)}
                        className="mt-0.5 h-5 w-5 shrink-0 accent-accent"
                      />
                      <span className="flex-1">
                        <span
                          className={`block text-sm leading-relaxed ${
                            checked[index]
                              ? "text-ink-soft line-through"
                              : "text-ink"
                          }`}
                        >
                          {item.label}
                        </span>
                        <span className="mt-0.5 block text-xs text-ink-soft">
                          {item.hint}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
