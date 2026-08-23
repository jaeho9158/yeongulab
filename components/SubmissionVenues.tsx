"use client";

import { useMemo, useState } from "react";

type Venue = {
  name: string;
  region: string;
  category: "국제 학술지" | "국내 공모전" | "포털/정보";
  field: string[];
  note: string;
  costNote: string;
  deadlineMonth: number | null;
  /** 공식 사이트가 확인된 경우에만 넣는다. 없으면 "검색해서 공식 공고 확인" 안내. */
  href?: string;
};

const VENUES: Venue[] = [
  {
    name: "Journal of Emerging Investigators (JEI)",
    region: "해외 · 오픈액세스 학술지",
    category: "국제 학술지",
    field: ["생물·물리"],
    note: "중·고등학생 대상 동료심사 학술지. 생물·물리 계열 연구를 받으며, 지도교사/멘토가 필요합니다. 영문 원고 필수.",
    costNote: "게재료 무료",
    deadlineMonth: null,
    href: "https://emerginginvestigators.org",
  },
  {
    name: "International Journal of High School Research (IJHSR)",
    region: "해외 · 오픈액세스 학술지",
    category: "국제 학술지",
    field: ["전분야"],
    note: "고등학생 저자 대상. 영문 원고 필수. 리뷰어 3인을 저자가 직접 섭외해야 합니다.",
    costNote: "투고 시 무료, 게재 확정 후 게재료 발생(수십만 원대)",
    deadlineMonth: null,
    href: "https://ijhsr.terrajournals.org",
  },
  {
    name: "Curieux Academic Journal",
    region: "해외 · 오픈액세스 학술지",
    category: "국제 학술지",
    field: ["전분야"],
    note: "중·고등학생 대상, 전 학문분야 수용. 영문 원고 필수.",
    costNote: "투고 시 무료, 게재 확정 후 게재료 발생(수십만 원대)",
    deadlineMonth: null,
    href: "https://www.curieuxacademicjournal.com",
  },
  {
    name: "삼성휴먼테크논문대상",
    region: "국내 · 논문 공모전",
    category: "국내 공모전",
    field: ["과학", "공학"],
    note: "국내 대표 논문 공모전. 고등부 이상만 응모 가능(중학생 불가)하고 지도교사 추천이 필요합니다. 접수는 대략 8~10월경이며 매년 일정이 바뀌므로 공고를 확인하세요.",
    costNote: "무료 응모",
    deadlineMonth: 9,
    href: "https://humantech.samsung.com",
  },
  {
    name: "전국과학전람회 (국립중앙과학관)",
    region: "국내 · 과학 탐구 대회",
    category: "국내 공모전",
    field: ["과학", "공학"],
    note: "학생부(초·중·고)와 교원·일반부로 나뉘는 전국 단위 과학 탐구 대회. 보통 시·도 예선(지역 과학전람회)을 거쳐 출품하므로 학교 과학 담당 선생님과 먼저 상의하세요.",
    costNote: "무료 출품",
    deadlineMonth: null,
    href: "https://www.science.go.kr/board?menuId=MENU00389",
  },
  {
    name: "한국청소년학술대회 (KSCY)",
    region: "국내 · 청소년 학술 컨퍼런스",
    category: "포털/정보",
    field: ["전분야"],
    note: "청소년이 연구를 발표·토론하는 컨퍼런스 형태의 행사로, 학술지 게재와는 다릅니다. 참가비가 있으니 비용과 발표 형식을 공고에서 확인하세요.",
    costNote: "참가비 있음 (공고 확인)",
    deadlineMonth: null,
    href: "https://www.kscy.kr",
  },
  {
    name: "사이언스올",
    region: "국내 · 과학문화 포털",
    category: "포털/정보",
    field: ["전분야"],
    note: "한국과학창의재단이 운영하는 과학경진대회·공모전 정보 포털. 청소년 대상 대회 일정을 모아볼 수 있습니다.",
    costNote: "포털 이용 무료 (개별 대회 비용은 상이)",
    deadlineMonth: null,
    href: "https://www.scienceall.com",
  },
];

const CATEGORIES: Array<Venue["category"] | "전체"> = [
  "전체",
  "국제 학술지",
  "국내 공모전",
  "포털/정보",
];

function sortByDeadline(list: Venue[]): Venue[] {
  return [...list].sort((a, b) => {
    if (a.deadlineMonth === null && b.deadlineMonth === null) return 0;
    if (a.deadlineMonth === null) return 1;
    if (b.deadlineMonth === null) return -1;
    return a.deadlineMonth - b.deadlineMonth;
  });
}

export function SubmissionVenues() {
  const [activeCategory, setActiveCategory] = useState<
    Venue["category"] | "전체"
  >("전체");

  const filteredVenues = useMemo(() => {
    const list =
      activeCategory === "전체"
        ? VENUES
        : VENUES.filter((v) => v.category === activeCategory);
    return sortByDeadline(list);
  }, [activeCategory]);

  return (
    <section className="card mt-10 px-5 py-5 sm:px-6 sm:py-6">
      <h2 className="text-lg font-bold text-ink">투고처 후보 모음</h2>
      <p className="mt-1 text-sm text-ink-soft">
        청소년 저자를 받는 곳 위주로 모았습니다. 마감월은 대략적인 참고용
        정보이며, 접수 기간·비용·요건은 자주 바뀌니 투고 전 반드시 공식
        사이트에서 최신 공고를 확인하세요.
      </p>
      <p className="mt-2 rounded-lg border border-line bg-surface px-4 py-2.5 text-xs leading-relaxed text-ink-soft">
        <strong className="text-ink">학술지 공통 주의:</strong> 해외 학술지는
        영문 원고가 필요하고, 대부분 지도교사의 공동 서명이나 확인을
        요구합니다. 같은 원고를 여러 곳에 동시에 내는 중복투고는 금지입니다.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            aria-pressed={activeCategory === cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
              activeCategory === cat
                ? "bg-ink text-bg"
                : "bg-surface text-ink-soft hover:text-ink"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <ul className="mt-4 space-y-3">
        {filteredVenues.map((v) => (
          <li key={v.name} className="rounded-lg bg-surface px-4 py-3">
            {v.href ? (
              <a
                href={v.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-ink hover:text-accent hover:underline"
              >
                {v.name} ↗
              </a>
            ) : (
              <p className="text-sm font-semibold text-ink">
                {v.name}{" "}
                <span className="text-xs font-normal text-ink-soft">
                  (검색해서 공식 공고 확인)
                </span>
              </p>
            )}
            <p className="mt-0.5 text-xs font-medium text-ink-soft">
              {v.region} · {v.field.join(", ")}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
              {v.note}
            </p>
            <p className="mt-1 text-xs text-ink-soft">
              비용: {v.costNote}
              {" · "}
              마감:{" "}
              {v.deadlineMonth !== null
                ? `대략 ${v.deadlineMonth}월경 (공식 공고 확인 필요)`
                : "비정기·공고 확인 필요"}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
