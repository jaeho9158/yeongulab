"use client";

import { josa } from "@/lib/korean";
import { usePersistentState } from "@/lib/usePersistentState";

/** 본문 '연구설계 유형 고르기' 표의 네 유형과 이름을 맞춘다. */
type DesignType = "설문조사" | "실험" | "문헌분석·자료분석" | "모델 구현";

const TYPES: DesignType[] = [
  "설문조사",
  "실험",
  "문헌분석·자료분석",
  "모델 구현",
];

type Option = {
  label: string;
  /** 유형별 가점. 한 선택지가 여러 유형에 걸치는 경우도 있다. */
  scores: Partial<Record<DesignType, number>>;
};

type Question = { id: string; legend: string; options: Option[] };

const QUESTIONS: Question[] = [
  {
    id: "asks",
    legend: "1. 내 연구질문이 묻는 것에 가장 가까운 것은?",
    options: [
      {
        label: "사람들의 인식·습관·실태가 어떤가",
        scores: { 설문조사: 3 },
      },
      {
        label: "A 조건이 B 조건보다 결과를 바꾸는가",
        scores: { 실험: 3 },
      },
      {
        label: "기존 연구·공개 데이터를 모으면 어떤 패턴이 보이는가",
        scores: { "문헌분석·자료분석": 3 },
      },
      {
        label: "이 원리로 예측·분류·시뮬레이션이 되는가",
        scores: { "모델 구현": 3 },
      },
    ],
  },
  {
    id: "causal",
    legend: "2. 결론에서 무엇을 말해야 하나?",
    options: [
      {
        label: "\"A 때문에 B가 달라진다\"는 원인을 말해야 한다",
        scores: { 실험: 3 },
      },
      {
        label: "\"A와 B가 같이 움직인다\"는 관계만 보여도 된다",
        scores: { 설문조사: 2, "문헌분석·자료분석": 1 },
      },
      {
        label: "현재 상태·분포가 어떤지 보여주는 게 목적이다",
        scores: { 설문조사: 2, "문헌분석·자료분석": 2 },
      },
      {
        label: "만든 것이 얼마나 잘 맞히는지(성능) 보여주는 게 목적이다",
        scores: { "모델 구현": 3 },
      },
    ],
  },
  {
    id: "resource",
    legend: "3. 내가 실제로 확보할 수 있는 것은?",
    options: [
      {
        label: "응답자를 모아 설문을 돌릴 수 있다",
        scores: { 설문조사: 3 },
      },
      {
        label: "조건을 나눠 다르게 해보고 직접 측정할 수 있다",
        scores: { 실험: 3 },
      },
      {
        label: "사람·장비 없이 공개된 논문과 자료만 쓸 수 있다",
        scores: { "문헌분석·자료분석": 3 },
      },
      {
        label: "데이터셋과 코드를 다룰 수 있다",
        scores: { "모델 구현": 3 },
      },
    ],
  },
  {
    id: "novelty",
    legend: "4. 이 연구에서 '새로운 것'은 어디서 나오나?",
    options: [
      {
        label: "아직 아무도 안 물어본 대상에게 물어본 것",
        scores: { 설문조사: 3 },
      },
      {
        label: "조건을 새로 조합해 비교해본 것",
        scores: { 실험: 3 },
      },
      {
        label: "흩어져 있던 자료를 새 기준으로 묶어 비교한 것",
        scores: { "문헌분석·자료분석": 3 },
      },
      {
        label: "기존 방법과 다른(또는 더 나은) 구현을 만든 것",
        scores: { "모델 구현": 3 },
      },
    ],
  },
];

const GUIDE: Record<
  DesignType,
  { makes: string; trap: string; next: string }
> = {
  설문조사: {
    makes: "설문 문항과 표본 계획을 만듭니다.",
    trap:
      "설문으로는 인과를 말할 수 없습니다 — \"같이 움직인다\"와 \"원인이다\"는 다릅니다. 결론 문장에서 이 선을 넘지 않도록 주의하세요.",
    next:
      "아래 '목적 진술 만들어보기'로 한 문장을 완성한 뒤, 4단계에서 '설문 문항 편향 체크'와 '표본 크기 계산기'를 쓰세요.",
  },
  실험: {
    makes: "조건 배정, 절차, 통제변수를 설계합니다.",
    trap:
      "인과를 말할 수 있는 유일한 유형이지만, 그건 무작위 배정과 통제변수가 제대로 됐을 때만입니다. 무엇을 같게 고정할지 먼저 적으세요.",
    next:
      "아래 '변수 정의표 만들기'로 독립·종속·통제변수를 적고, 4단계에서 '랜덤 표본 추첨기'로 배정하세요.",
  },
  "문헌분석·자료분석": {
    makes: "문헌·데이터 선정 기준과 분석 절차를 정합니다.",
    trap:
      "'정리'에서 멈추면 연구가 아니라 조사가 됩니다. 자료를 모으기 전에 선정 기준과 비교할 지표를 정해두어야 탐구가 됩니다.",
    next:
      "아래 '목적 진술 만들어보기'로 무엇을 어떤 기준으로 비교할지 한 문장으로 적고, 2단계 '내 레퍼런스 목록'에 근거를 모으세요.",
  },
  "모델 구현": {
    makes: "모델 구조, 학습·검증 데이터, 평가지표를 정합니다.",
    trap:
      "구현했다는 사실 자체는 결과가 아닙니다. 무엇과 비교해 얼마나 나은지 말할 수 있어야 하므로, 기준 모델과 평가지표를 만들기 전에 정하세요.",
    next:
      "아래 '변수 정의표 만들기'에서 입력·출력·평가지표를 정리하고, 5단계 '간이 통계 계산기'로 성능 차이를 확인하세요.",
  },
};

function tally(answers: Record<string, number>) {
  const totals: Record<DesignType, number> = {
    설문조사: 0,
    실험: 0,
    "문헌분석·자료분석": 0,
    "모델 구현": 0,
  };
  for (const q of QUESTIONS) {
    const picked = q.options[answers[q.id] ?? -1];
    if (!picked) continue;
    for (const type of TYPES) {
      totals[type] += picked.scores[type] ?? 0;
    }
  }
  return totals;
}

export function ResearchDesignQuiz() {
  const [answers, setAnswers] = usePersistentState<Record<string, number>>(
    "design-quiz",
    {},
  );

  const answered = QUESTIONS.filter((q) => answers[q.id] !== undefined).length;
  const done = answered === QUESTIONS.length;

  const totals = tally(answers);
  const ranked = TYPES.map((t) => ({ type: t, score: totals[t] })).sort(
    (a, b) => b.score - a.score,
  );
  const top = ranked[0];
  // 1점 차 이내면 사실상 접전 — 하나로 단정하지 않는다
  const rival =
    ranked[1] && top.score - ranked[1].score <= 1 ? ranked[1] : null;

  return (
    <section className="card mt-10 px-5 py-5 sm:px-6 sm:py-6">
      <h2 className="text-lg font-bold text-ink">
        내 연구질문에 맞는 설계 유형 찾기
      </h2>
      <p className="mt-1 text-sm text-ink-soft">
        위 표의 네 유형 중 어디서 시작할지 정하는 걸 돕는 참고용 도구입니다.
        정답을 알려주는 게 아니라, 지금 상황에서 가장 무리 없는 쪽을
        가리킬 뿐입니다.
      </p>

      <div className="mt-4 space-y-5">
        {QUESTIONS.map((q) => (
          <fieldset key={q.id}>
            <legend className="text-sm font-semibold text-ink">
              {q.legend}
            </legend>
            <div className="mt-2 space-y-1">
              {q.options.map((opt, i) => (
                <label
                  key={opt.label}
                  className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2.5 hover:bg-surface"
                >
                  <input
                    type="radio"
                    name={`design-quiz-${q.id}`}
                    checked={answers[q.id] === i}
                    onChange={() =>
                      setAnswers((prev) => ({ ...prev, [q.id]: i }))
                    }
                    className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
                  />
                  <span className="text-sm leading-relaxed text-ink">
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <div aria-live="polite" className="mt-4">
        {done ? (
          <div className="rounded-lg bg-surface px-4 py-3.5">
            <p className="text-sm font-semibold text-ink">
              {rival
                ? `${top.type}${josa(top.type, ["과", "와"])} ${rival.type} 사이입니다`
                : `${top.type}${josa(top.type, ["이", "가"])} 가장 잘 맞습니다`}
            </p>

            {rival ? (
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                두 유형이 비슷하게 나왔습니다. 한 연구에 두 유형이 섞여도
                되지만, 목적 진술을 한 문장으로 쓰려면 <strong className="text-ink">주가 되는 유형 하나</strong>를
                정해야 합니다. 아래 두 설명을 읽고 지금 자원으로 끝까지 갈 수
                있는 쪽을 고르세요.
              </p>
            ) : (
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                {GUIDE[top.type].makes}
              </p>
            )}

            <div className="mt-3 space-y-3">
              {(rival ? [top.type, rival.type] : [top.type]).map((type) => (
                <div key={type}>
                  {rival && (
                    <p className="text-sm font-medium text-ink">
                      {type} — {GUIDE[type].makes}
                    </p>
                  )}
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                    <strong className="text-ink">함정:</strong>{" "}
                    {GUIDE[type].trap}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                    <strong className="text-ink">다음:</strong>{" "}
                    {GUIDE[type].next}
                  </p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setAnswers({})}
              className="mt-3 rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-soft transition hover:border-accent"
            >
              다시 고르기
            </button>
          </div>
        ) : (
          <p className="text-sm text-ink-soft">
            {answered} / {QUESTIONS.length}개 선택 — 네 문항을 모두 고르면
            결과가 나옵니다.
          </p>
        )}
      </div>
    </section>
  );
}
