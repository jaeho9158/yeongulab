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
  href: string;
};

const VENUES: Venue[] = [
  {
    name: "Journal of Emerging Investigators (JEI)",
    region: "해외 · 오픈액세스 학술지",
    category: "국제 학술지",
    field: ["전분야"],
    note: "중·고등학생 대상 동료심사 학술지. 생물·물리 전 분야, 지도교사/멘토 필요.",
    costNote: "게재료 무료",
    deadlineMonth: null,
    href: "https://emerginginvestigators.org",
  },
  {
    name: "International Journal of High School Research (IJHSR)",
    region: "해외 · 오픈액세스 학술지",
    category: "국제 학술지",
    field: ["전분야"],
    note: "고등학생 저자 대상. 리뷰어 3인을 저자가 직접 섭외해야 함.",
    costNote: "투고 시 무료, 게재 확정 후 비용 발생",
    deadlineMonth: null,
    href: "https://ijhsr.terrajournals.org",
  },
  {
    name: "Curieux Academic Journal",
    region: "해외 · 오픈액세스 학술지",
    category: "국제 학술지",
    field: ["전분야"],
    note: "중·고등학생 대상, 전 학문분야 수용.",
    costNote: "투고 시 무료, 게재 확정 후 비용 발생",
    deadlineMonth: null,
    href: "https://www.curieuxacademicjournal.com",
  },
  {
    name: "삼성휴먼테크논문대상",
    region: "국내 · 논문 공모전",
    category: "국내 공모전",
    field: ["과학", "공학"],
    note: "국내 대표 청소년·대학(원)생 논문 공모전. 매년 초록 접수 일정이 바뀌므로 공고를 확인하세요.",
    costNote: "무료 응모",
    deadlineMonth: 9,
    href: "https://humantech.samsung.com",
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

      <div className="mt-4 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
              activeCategory === cat
                ? "bg-accent text-white"
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
            <a
              href={v.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-ink hover:text-accent hover:underline"
            >
              {v.name} ↗
            </a>
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
