import type { Metadata } from "next";
import Link from "next/link";
import { getAllStages } from "@/lib/guide";
import {
  isStageSlug,
  STAGE_TOOL_TITLES,
  TOOL_DESCRIPTIONS,
} from "@/lib/stageToolMeta";

/**
 * 단계마다 "도구를 언제 꺼내 쓰는가"를 한 덩어리로 설명한다.
 * 제목과 한 줄 설명만 나열하면 링크 목록처럼 보여서, 이 페이지만 읽어도
 * 연구 흐름 안에서 도구의 자리를 알 수 있게 문단을 둔다.
 */
const STAGE_TOOL_INTROS: Record<string, string> = {
  topic:
    "아직 무엇을 연구할지 정하지 못했을 때 쓰는 도구입니다. 막연한 관심사를 질문 형태로 바꾸고, 그 질문이 찾아보면 나오는 것인지 직접 확인해야 아는 것인지 가려냅니다.",
  "prior-research":
    "주제를 정한 뒤 이미 누가 무엇을 밝혀뒀는지 확인하는 단계의 도구입니다. 키워드로 논문을 찾아 초록까지 훑고, 쓸 만한 것을 인용 형식과 함께 모아둡니다.",
  methodology:
    "데이터를 모으기 전에 설계를 종이 위에서 끝내는 도구입니다. 어떤 방식으로 확인할지 고르고, 목적 문장과 변수 정의를 미리 고정해두면 나중에 결과 해석이 흔들리지 않습니다.",
  "data-collection":
    "자료를 모으기 직전과 모으는 동안 쓰는 도구입니다. 몇 명이 필요한지 역산하고, 설문 문항에 이중 질문이나 유도 표현이 없는지 점검하고, 표본을 편향 없이 뽑습니다.",
  writing:
    "모은 데이터를 결과로 바꾸고 글로 옮기는 단계의 도구입니다. 통계 계산, 그래프 작도, 캡션과 인용 형식 맞추기처럼 손이 많이 가면서 실수가 잦은 일을 대신합니다.",
  submission:
    "원고를 내보내고 발표를 준비하는 단계의 도구입니다. 어디에 낼지 조건별로 고르고, 마감을 놓치지 않게 관리하고, 심사장에서 받을 질문을 미리 연습합니다.",
};

export const metadata: Metadata = {
  title: "연구 도구 23개 — 계산기·체크리스트·생성기",
  description:
    "표본 크기 계산, 통계 검정, 설문 편향 점검, 인용 형식 변환까지. 연구 단계마다 필요한 도구를 한 곳에 모았습니다. 설치도 로그인도 없이 바로 씁니다.",
  keywords: [
    "청소년 연구 도구",
    "표본 크기 계산기",
    "통계 계산기",
    "설문 문항 편향",
    "인용 형식 변환",
  ],
};

export default function ToolsPage() {
  // 단계 순서(order)대로 나열해야 가이드 진행 순서와 목차가 일치한다
  const stages = getAllStages();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-ink">연구 도구</h1>
      <p className="mt-4 text-[17px] leading-[1.7] text-ink-soft">
        표본 크기 계산기, 간이 통계 계산기, 설문 문항 편향 체크처럼 6단계
        가이드 안에 접혀 있던 도구 23개를 한 페이지에 모았습니다. 입력한
        값은 서버로 전송되지 않고 이 브라우저에만 저장되니, 다른 기기에서는
        다시 입력해야 합니다.
      </p>
      {/* 아코디언(components/StageTools.tsx)은 open={i === 0}으로 첫 도구만
          펼친다. #tools 앵커는 목록 맨 위로만 데려다주므로 "누르면 그 도구가
          펼쳐진다"고 쓰면 사실과 달라진다 — 실제 동작 그대로 안내한다. */}
      <p className="mt-3 text-[17px] leading-[1.7] text-ink-soft">
        각 도구는 해당 연구 단계 페이지의 접이식 목록 안에 있습니다. 아래
        링크를 누르면 그 단계의 도구 목록으로 이동하고, 펼쳐진 것은 목록의 첫
        도구이니 원하는 도구는 제목을 눌러 펼치면 됩니다. 일부 도구는 여러
        단계에서 함께 쓰입니다.
      </p>

      {stages.map((stage) => {
        // 타입 가드를 쓰면 캐스트 없이 STAGE_TOOL_TITLES 인덱싱이 안전해진다
        if (!isStageSlug(stage.slug)) return null;
        const titles = STAGE_TOOL_TITLES[stage.slug];

        return (
          <section key={stage.slug} className="mt-10">
            <h2 className="font-label text-sm font-semibold tracking-wide text-accent">
              {stage.order}단계 · {stage.title}
            </h2>
            <p className="mt-2 text-[15px] leading-[1.7] text-ink-soft">
              {STAGE_TOOL_INTROS[stage.slug]}
            </p>
            <ol className="mt-4 border-b border-line">
              {titles.map((title) => (
                <li key={title} className="border-t border-line">
                  <Link
                    href={`/guide/${stage.slug}#tools`}
                    className="group block py-4"
                  >
                    <span className="block text-[17px] font-semibold text-ink transition group-hover:text-accent">
                      {title}
                    </span>
                    <span className="mt-1 block text-sm leading-[1.65] text-ink-soft">
                      {TOOL_DESCRIPTIONS[title]}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        );
      })}

      <div className="mt-10 border-t border-ink pt-5">
        <p className="text-sm leading-[1.7] text-ink-soft">
          어느 도구를 써야 할지 아직 감이 안 온다면{" "}
          <Link href="/guide" className="text-accent hover:underline">
            6단계 가이드
          </Link>
          부터 순서대로 보세요. 개념 자체가 궁금하다면{" "}
          <Link href="/articles" className="text-accent hover:underline">
            자료실
          </Link>
          에 더 깊은 설명이 있습니다.
        </p>
      </div>
    </div>
  );
}
