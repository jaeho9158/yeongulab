import type { ReactNode } from "react";
import { PriorResearchSearch } from "@/components/PriorResearchSearch";
import { ObjectiveTemplateGenerator } from "@/components/ObjectiveTemplateGenerator";
import { ResearchQuestionQuiz } from "@/components/ResearchQuestionQuiz";
import { SampleSizeCalculator } from "@/components/SampleSizeCalculator";
import { StatsCalculator } from "@/components/StatsCalculator";
import { CitationFormatter } from "@/components/CitationFormatter";
import { DeadlineTracker } from "@/components/DeadlineTracker";
import { VariableTableBuilder } from "@/components/VariableTableBuilder";
import { DisclosureGenerator } from "@/components/DisclosureGenerator";
import { SimpleChart } from "@/components/SimpleChart";
import { ImradChecker } from "@/components/ImradChecker";
import { ReferenceList } from "@/components/ReferenceList";
import { TopicIdeaGenerator } from "@/components/TopicIdeaGenerator";
import { PresentationQuestionBank } from "@/components/PresentationQuestionBank";
import { SpeechTimer } from "@/components/SpeechTimer";
import { SurveyBiasChecker } from "@/components/SurveyBiasChecker";
import { RandomSampler } from "@/components/RandomSampler";
import { LengthChecker } from "@/components/LengthChecker";
import { FigureCaptionHelper } from "@/components/FigureCaptionHelper";
import { SubmissionVenues } from "@/components/SubmissionVenues";
import { EthicsChecklist } from "@/components/EthicsChecklist";

type Tool = { title: string; render: (slug: string) => ReactNode };

/** 단계별 도구 목록 — 단계 페이지의 접이식 도구 섹션과 홈의 '도구 N' 표기가 함께 쓴다. */
export const STAGE_TOOLS: Record<string, Tool[]> = {
  topic: [
    { title: "연구주제 아이디어 뽑기", render: () => <TopicIdeaGenerator /> },
    { title: "내 연구질문, 조사형일까 탐구형일까", render: () => <ResearchQuestionQuiz /> },
  ],
  "prior-research": [
    { title: "선행연구 검색해보기", render: () => <PriorResearchSearch /> },
    { title: "내 레퍼런스 목록", render: () => <ReferenceList /> },
  ],
  methodology: [
    { title: "목적 진술 만들어보기", render: () => <ObjectiveTemplateGenerator /> },
    { title: "변수 정의표 만들기", render: () => <VariableTableBuilder /> },
  ],
  "data-collection": [
    { title: "표본 크기 계산기", render: () => <SampleSizeCalculator /> },
    { title: "설문 문항 편향 체크", render: () => <SurveyBiasChecker /> },
    { title: "랜덤 표본 추첨기", render: () => <RandomSampler /> },
  ],
  writing: [
    { title: "간이 통계 계산기", render: () => <StatsCalculator /> },
    { title: "간이 차트 그리기", render: () => <SimpleChart /> },
    { title: "그림·표 캡션 도우미", render: () => <FigureCaptionHelper /> },
    { title: "IMRaD 구조 점검", render: () => <ImradChecker /> },
    { title: "분량 체크기", render: () => <LengthChecker /> },
    { title: "인용 형식 만들어보기", render: () => <CitationFormatter /> },
    { title: "내 레퍼런스 목록", render: () => <ReferenceList /> },
    { title: "연구윤리 · 재현가능성 체크리스트", render: (slug) => <EthicsChecklist slug={slug} /> },
  ],
  submission: [
    { title: "투고처 후보 모음", render: () => <SubmissionVenues /> },
    { title: "AI 활용 disclosure 문구 만들기", render: () => <DisclosureGenerator /> },
    { title: "예상 질문 뽑기", render: () => <PresentationQuestionBank /> },
    { title: "발표 시간 재보기", render: () => <SpeechTimer /> },
    { title: "마감일 트래커", render: () => <DeadlineTracker /> },
  ],
};

export function getToolCount(slug: string): number {
  return STAGE_TOOLS[slug]?.length ?? 0;
}

/** 도구를 접이식 목록으로. 첫 번째만 펼쳐두고 나머지는 제목만 보인다. */
export function ToolAccordion({ slug }: { slug: string }) {
  const tools = STAGE_TOOLS[slug];
  if (!tools || tools.length === 0) return null;

  return (
    <section id="tools" className="mt-10 scroll-mt-24">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-bold text-ink">도구</h2>
        <p className="text-sm text-ink-soft">입력값은 이 기기에 저장됩니다</p>
      </div>
      <div className="card mt-3 divide-y divide-line overflow-hidden">
        {tools.map((tool, i) => (
          <details key={tool.title} open={i === 0} className="group">
            <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-3.5 text-[15px] font-semibold text-ink hover:bg-surface [&::-webkit-details-marker]:hidden">
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
              {tool.title}
            </summary>
            <div className="tool-embed px-5 pb-5 pl-12">{tool.render(slug)}</div>
          </details>
        ))}
      </div>
    </section>
  );
}
