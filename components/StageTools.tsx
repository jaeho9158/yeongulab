"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import {
  STAGE_TOOL_TITLES,
  isStageSlug,
  type ToolTitle,
} from "@/lib/stageToolMeta";

// 도구는 모두 next/dynamic으로 싣는다 — 이 단계에서 실제로 그리는 도구의 청크만
// 내려받고, 홈·가이드 목록처럼 '도구 N' 표기만 쓰는 곳은 lib/stageToolMeta만 본다.
// (서버 컴포넌트에서 클라이언트 컴포넌트를 dynamic으로 불러오면 코드 분할이
// 되지 않으므로 이 모듈 자체가 클라이언트 경계다.)
const PriorResearchSearch = dynamic(() =>
  import("@/components/PriorResearchSearch").then((m) => m.PriorResearchSearch),
);
const ObjectiveTemplateGenerator = dynamic(() =>
  import("@/components/ObjectiveTemplateGenerator").then(
    (m) => m.ObjectiveTemplateGenerator,
  ),
);
const ResearchQuestionQuiz = dynamic(() =>
  import("@/components/ResearchQuestionQuiz").then((m) => m.ResearchQuestionQuiz),
);
const SampleSizeCalculator = dynamic(() =>
  import("@/components/SampleSizeCalculator").then((m) => m.SampleSizeCalculator),
);
const StatsCalculator = dynamic(() =>
  import("@/components/StatsCalculator").then((m) => m.StatsCalculator),
);
const CitationFormatter = dynamic(() =>
  import("@/components/CitationFormatter").then((m) => m.CitationFormatter),
);
const DeadlineTracker = dynamic(() =>
  import("@/components/DeadlineTracker").then((m) => m.DeadlineTracker),
);
const VariableTableBuilder = dynamic(() =>
  import("@/components/VariableTableBuilder").then((m) => m.VariableTableBuilder),
);
const DisclosureGenerator = dynamic(() =>
  import("@/components/DisclosureGenerator").then((m) => m.DisclosureGenerator),
);
const SimpleChart = dynamic(() =>
  import("@/components/SimpleChart").then((m) => m.SimpleChart),
);
const ImradChecker = dynamic(() =>
  import("@/components/ImradChecker").then((m) => m.ImradChecker),
);
const ReferenceList = dynamic(() =>
  import("@/components/ReferenceList").then((m) => m.ReferenceList),
);
const TopicIdeaGenerator = dynamic(() =>
  import("@/components/TopicIdeaGenerator").then((m) => m.TopicIdeaGenerator),
);
const PresentationQuestionBank = dynamic(() =>
  import("@/components/PresentationQuestionBank").then(
    (m) => m.PresentationQuestionBank,
  ),
);
const SpeechTimer = dynamic(() =>
  import("@/components/SpeechTimer").then((m) => m.SpeechTimer),
);
const SurveyBiasChecker = dynamic(() =>
  import("@/components/SurveyBiasChecker").then((m) => m.SurveyBiasChecker),
);
const RandomSampler = dynamic(() =>
  import("@/components/RandomSampler").then((m) => m.RandomSampler),
);
const LengthChecker = dynamic(() =>
  import("@/components/LengthChecker").then((m) => m.LengthChecker),
);
const FigureCaptionHelper = dynamic(() =>
  import("@/components/FigureCaptionHelper").then((m) => m.FigureCaptionHelper),
);
const SubmissionVenues = dynamic(() =>
  import("@/components/SubmissionVenues").then((m) => m.SubmissionVenues),
);
const EthicsChecklist = dynamic(() =>
  import("@/components/EthicsChecklist").then((m) => m.EthicsChecklist),
);
const ResearchDesignQuiz = dynamic(() =>
  import("@/components/ResearchDesignQuiz").then((m) => m.ResearchDesignQuiz),
);
const AcademicPhrases = dynamic(() =>
  import("@/components/AcademicPhrases").then((m) => m.AcademicPhrases),
);
const ResearchShowcaseForm = dynamic(() =>
  import("@/components/ResearchShowcaseForm").then(
    (m) => m.ResearchShowcaseForm,
  ),
);

/** 도구 제목 → 렌더러. 제목은 lib/stageToolMeta가 단일 출처이며, 빠지면 타입 오류. */
const TOOL_RENDERERS: Record<ToolTitle, (slug: string) => ReactNode> = {
  "연구주제 아이디어 뽑기": () => <TopicIdeaGenerator />,
  "내 연구질문, 조사형일까 탐구형일까": () => <ResearchQuestionQuiz />,
  "선행연구 검색해보기": () => <PriorResearchSearch />,
  "내 레퍼런스 목록": () => <ReferenceList />,
  "내 연구질문에 맞는 설계 유형 찾기": () => <ResearchDesignQuiz />,
  "목적 진술 만들어보기": () => <ObjectiveTemplateGenerator />,
  "변수 정의표 만들기": () => <VariableTableBuilder />,
  "표본 크기 계산기": () => <SampleSizeCalculator />,
  "설문 문항 편향 체크": () => <SurveyBiasChecker />,
  "랜덤 표본 추첨기": () => <RandomSampler />,
  "간이 통계 계산기": () => <StatsCalculator />,
  "간이 차트 그리기": () => <SimpleChart />,
  "그림·표 캡션 도우미": () => <FigureCaptionHelper />,
  "IMRaD 구조 점검": () => <ImradChecker />,
  "논문에 쓰는 영어 표현": () => <AcademicPhrases />,
  "분량 체크기": () => <LengthChecker />,
  "인용 형식 만들어보기": () => <CitationFormatter />,
  "연구윤리 · 재현가능성 체크리스트": (slug) => <EthicsChecklist slug={slug} />,
  "투고처 후보 모음": () => <SubmissionVenues />,
  "AI 활용 disclosure 문구 만들기": () => <DisclosureGenerator />,
  "예상 질문 뽑기": () => <PresentationQuestionBank />,
  "발표 시간 재보기": () => <SpeechTimer />,
  "마감일 트래커": () => <DeadlineTracker />,
  "내 연구 사례 나누기": () => <ResearchShowcaseForm />,
};

/** 도구를 접이식 목록으로. 첫 번째만 펼쳐두고 나머지는 제목만 보인다. */
export function ToolAccordion({ slug }: { slug: string }) {
  if (!isStageSlug(slug)) return null;
  const titles = STAGE_TOOL_TITLES[slug];

  return (
    <section id="tools" className="mt-10 scroll-mt-24">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-bold text-ink">도구</h2>
        <p className="text-sm text-ink-soft">입력값은 이 기기에 저장됩니다</p>
      </div>
      <div className="card mt-3 divide-y divide-line overflow-hidden">
        {titles.map((title, i) => (
          <details key={title} open={i === 0} className="group">
            {/* 카드가 overflow-hidden이라 포커스 링이 잘리지 않도록 안쪽으로 그린다 */}
            <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-3.5 text-ink hover:bg-surface focus-visible:outline-offset-[-2px] [&::-webkit-details-marker]:hidden">
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
                className="shrink-0 text-ink-soft transition group-open:rotate-90 group-open:text-ink"
              >
                <path d="M9 6l6 6-6 6" />
              </svg>
              {/* summary는 제목 콘텐츠를 허용하므로 문서 개요에 도구 제목이 남는다 */}
              <h3 className="inline text-[15px] font-semibold">{title}</h3>
            </summary>
            <div className="tool-embed px-5 pb-5 pl-5 sm:pl-12">
              {TOOL_RENDERERS[title](slug)}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
