import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "연구 과정 한눈에 보기 — 예시로 따라가는 6단계",
  description:
    "고등학생이 실제로 할 수 있는 가상의 예시 연구 하나를 주제 선정부터 저널 투고까지 6단계 전체로 따라갑니다. 연구질문 다듬기, 변수 표, 표본 계획, t-검정 결과, IMRaD 요약까지 완성된 형태를 보여드립니다.",
  keywords: [
    "청소년 연구 예시",
    "고등학생 연구 과정",
    "연구질문 예시",
    "t검정 예시",
    "IMRaD 예시",
  ],
};

function FictionNotice() {
  return (
    <div className="note-box px-6 py-5">
      <p className="text-sm leading-relaxed text-ink-soft">
        <strong className="text-ink">이 페이지는 가상의 예시입니다.</strong>{" "}
        등장하는 학생, 데이터, 결과 수치, 참고문헌은 모두 교육 목적으로 만든
        것이며 실제 연구가 아닙니다. 형식과 사고 과정을 참고하는 용도로만
        봐주세요.
      </p>
    </div>
  );
}

function StageHeading({
  order,
  title,
  slug,
}: {
  order: number;
  title: string;
  slug: string;
}) {
  return (
    <div className="mt-14 flex items-center gap-4">
      <span className="step-badge">{String(order).padStart(2, "0")}</span>
      <div>
        <h2 className="text-xl font-bold text-ink">{title}</h2>
        <Link
          href={`/guide/${slug}`}
          className="text-sm text-accent hover:underline"
        >
          이 단계 가이드 보기 →
        </Link>
      </div>
    </div>
  );
}

function WhyBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="note-box mt-5 px-5 py-4">
      <p className="text-xs font-semibold tracking-wide text-ink">
        왜 이렇게 했나
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{children}</p>
    </div>
  );
}

export default function ExamplePage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-sm font-medium text-accent">가상의 예시 연구</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink">
        한 편의 연구가 6단계를 통과하는 과정
      </h1>
      <p className="mt-4 max-w-xl leading-relaxed text-ink-soft">
        가이드의 각 단계가 실제로 무엇을 만들어내는지, 가상의 고등학생
        &lsquo;지우&rsquo;의 연구 하나를 처음부터 끝까지 따라가며 보여드립니다.
        각 단계마다 지우가 실제로 만든 산출물과, 왜 그렇게 했는지에 대한 짧은
        해설이 붙어 있습니다.
      </p>

      <div className="mt-8">
        <FictionNotice />
      </div>

      {/* 1단계 */}
      <StageHeading order={1} title="주제 선정" slug="topic" />
      <div className="card mt-5 px-6 py-5">
        <p className="text-sm text-ink-soft">
          지우는 시험 기간에 카페의 소음 속에서 오히려 공부가 잘 됐던 경험에서
          출발했습니다. 처음 적은 질문은 이랬습니다.
        </p>
        <p className="mt-3 rounded-lg bg-surface px-4 py-3 text-sm text-ink-soft">
          초안(조사형): &ldquo;백색소음이 집중력에 좋은지 <em>조사한다</em>
          &rdquo;
        </p>
        <p className="mt-3 text-sm text-ink-soft">
          검색해보니 이미 답이 정리된 자료가 많았습니다. &ldquo;왜?&rdquo;를
          반복하며 아직 확인되지 않은 구체적 변수를 찾아 질문을 다듬었습니다.
        </p>
        <p className="mt-3 rounded-lg bg-surface px-4 py-3 text-sm text-ink">
          다듬은 질문(탐구형): &ldquo;백색소음 환경은 조용한 환경에 비해
          고등학생의 단기 기억 과제(단어 회상) 점수를 <em>높이는가?</em>&rdquo;
        </p>
      </div>
      <WhyBox>
        &ldquo;좋은지 조사한다&rdquo;는 이미 존재하는 답을 찾는 조사형
        질문입니다. 대상(고등학생), 비교 조건(백색소음 vs 조용한 환경), 측정
        지표(단어 회상 점수)를 명시하자 직접 검증할 수 있는 탐구형 질문이
        됐습니다. 실험실 없이 교실과 스피커만으로 가능한 규모라는 점도
        확인했습니다.
      </WhyBox>

      {/* 2단계 */}
      <StageHeading order={2} title="선행연구 조사" slug="prior-research" />
      <div className="card mt-5 px-6 py-5">
        <p className="text-sm text-ink-soft">
          &lsquo;백색소음&rsquo;, &lsquo;단기 기억&rsquo;, &lsquo;청소년
          집중력&rsquo; 키워드로 학술 검색을 하고, 체크리스트의
          &ldquo;5~10편&rdquo; 기준에 맞춰 관련성 높은 문헌 6편을 골라 핵심을
          한 줄씩 정리했습니다. (아래 문헌은 모두 형식을 보여주기 위한 가상의
          예시 문헌입니다.)
        </p>
        <ul className="mt-3 space-y-2 text-sm text-ink-soft">
          <li className="rounded-lg bg-surface px-4 py-3">
            김철수, 박영희 (2023). 청소년의 학습 환경과 집중력. 청소년연구,
            15(2), 123-145. <em>(가상의 예시 문헌)</em> — 소음의
            &lsquo;종류&rsquo;에 따라 효과가 갈릴 수 있음을 시사.
          </li>
          <li className="rounded-lg bg-surface px-4 py-3">
            이민준 (2022). 백색소음과 과제 수행에 관한 연구 동향. 교육심리학회지,
            8(1), 55-71. <em>(가상의 예시 문헌)</em> — 성인 대상 연구는 많지만
            고등학생 대상은 드물다는 공백 확인.
          </li>
          <li className="rounded-lg bg-surface px-4 py-3">
            정수아, 최도현 (2021). 단어 회상 과제를 이용한 단기 기억 측정.
            인지과학연구, 12(3), 201-218. <em>(가상의 예시 문헌)</em> —
            20개 단어·2분 암기·자유 회상이라는 표준 절차를 방법으로 채택.
          </li>
          <li className="rounded-lg bg-surface px-4 py-3">
            한서윤 (2020). 소음 수준이 단순 과제 수행에 미치는 영향. 환경심리연구,
            6(2), 88-104. <em>(가상의 예시 문헌)</em> — 약 50dB 수준에서
            수행이 가장 안정적이었다는 보고 → 소음 크기 결정 근거.
          </li>
          <li className="rounded-lg bg-surface px-4 py-3">
            Park, J., &amp; Lee, S. (2019). White noise and working memory in
            adolescents. <em>Journal of Student Cognition</em>, 4(1), 12-25.{" "}
            <em>(가상의 예시 문헌)</em> — 개인별로 소음 선호가 달라 평균
            효과가 작게 나올 수 있음을 지적.
          </li>
          <li className="rounded-lg bg-surface px-4 py-3">
            오지훈, 강나래 (2018). 학교 현장 실험 연구의 설계와 한계. 교육연구방법,
            10(4), 301-320. <em>(가상의 예시 문헌)</em> — 같은 교실에서 조건
            순서를 무작위로 바꾸는 설계를 권장.
          </li>
        </ul>
      </div>
      <WhyBox>
        선행연구 조사의 목표는 &ldquo;많이 읽기&rdquo;가 아니라 두 가지를
        확인하는 것입니다 — 내 질문에 이미 답이 나와 있는가(연구 공백 확인),
        그리고 남들이 검증해둔 측정 방법을 빌려올 수 있는가. 지우는 고등학생
        대상 연구가 드물다는 공백을 찾았고, 단어 회상 절차를 그대로 가져와
        방법의 신뢰도를 확보했습니다.
      </WhyBox>

      {/* 3단계 */}
      <StageHeading order={3} title="방법론 설계" slug="methodology" />
      <div className="card mt-5 px-6 py-5">
        <p className="text-sm font-semibold text-ink">
          목적 진술 (&lsquo;목적 진술 만들어보기&rsquo; 도구 사용)
        </p>
        <p className="mt-2 rounded-lg bg-surface px-4 py-3 text-sm text-ink">
          본 연구는 백색소음 환경이 고등학생의 단어 회상 과제에서 조용한
          환경보다 높은 점수를 보이는지를 실험적으로 규명하는 것을 목적으로
          한다.
        </p>
        <p className="mt-5 text-sm font-semibold text-ink">
          변수 표 (&lsquo;변수 정의표 만들기&rsquo; 도구로 복사한 형식)
        </p>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-ink">
                <th className="py-2 pr-4 font-semibold">변수명</th>
                <th className="py-2 pr-4 font-semibold">구분</th>
                <th className="py-2 font-semibold">설명/측정 방법</th>
              </tr>
            </thead>
            <tbody className="text-ink-soft">
              <tr className="border-b border-line">
                <td className="py-2 pr-4">청각 환경</td>
                <td className="py-2 pr-4">독립변수</td>
                <td className="py-2">백색소음(50±3 dB) vs 조용한 환경</td>
              </tr>
              <tr className="border-b border-line">
                <td className="py-2 pr-4">단어 회상 점수</td>
                <td className="py-2 pr-4">종속변수</td>
                <td className="py-2">20개 단어 중 회상한 개수 (0~20점)</td>
              </tr>
              <tr className="border-b border-line">
                <td className="py-2 pr-4">장소</td>
                <td className="py-2 pr-4">통제변수</td>
                <td className="py-2">같은 교실</td>
              </tr>
              <tr className="border-b border-line">
                <td className="py-2 pr-4">단어 목록</td>
                <td className="py-2 pr-4">통제변수</td>
                <td className="py-2">동일 난이도의 같은 목록</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">암기 시간</td>
                <td className="py-2 pr-4">통제변수</td>
                <td className="py-2">2분 고정 (타이머)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-5 text-sm text-ink-soft">
          <strong className="text-ink">연구윤리:</strong> 사람을 대상으로 하는
          연구이므로 참여 학생 전원에게 연구 목적·절차를 설명하고 서면 동의를
          받았으며, 미성년자이므로 보호자 동의서도 함께 받았습니다. 점수는
          익명 처리했습니다.
        </p>
      </div>
      <WhyBox>
        목적 진술 한 문장에 검증 대상·조건·방법이 모두 들어가면 이후 단계가
        흔들리지 않습니다. 변수 표를 먼저 만들어두면 &ldquo;무엇을 측정하고
        무엇을 고정할지&rdquo;가 명확해져서, 나중에 &ldquo;결과 차이가 소음
        때문인지 시간대 때문인지&rdquo; 같은 반박에 미리 대비할 수 있습니다.
      </WhyBox>

      {/* 4단계 */}
      <StageHeading order={4} title="데이터 수집" slug="data-collection" />
      <div className="card mt-5 px-6 py-5">
        <p className="text-sm text-ink-soft">
          <strong className="text-ink">표본 계획:</strong> 사이트의
          &lsquo;표본 크기 계산기&rsquo;는 설문·비율 조사용이라 두 집단 평균
          비교에는 쓸 수 없었습니다. 선생님께 여쭤보니 중간 크기 효과(d=0.5)를
          80% 확률로 잡아내려면 집단당 약 64명이 필요하다고 했지만, 현실적으로
          모집 가능한 인원은 집단당 16명(총 32명)이었습니다. 그래서 이 인원으로
          진행하되, &ldquo;이 표본으로는 큰 효과만 검출할 수 있다&rdquo;는
          점을 논문의 제한점에 적기로 했습니다.
        </p>
        <p className="mt-3 text-sm text-ink-soft">
          참여자 32명을 제비뽑기로 두 집단에 무작위 배정했습니다. 두 소리
          조건을 한 교실에서 동시에 틀 수는 없으므로, 같은 교실에서 연속된 두
          교시에 조건 순서를 무작위로 정해 실시했습니다. 소음 크기는 스마트폰
          소음 측정 앱으로 학생 자리에서 50±3 dB임을 확인했습니다.
        </p>
        <p className="mt-4 rounded-lg bg-surface px-4 py-3 text-sm text-ink-soft">
          <strong className="text-ink">수집 결과 (가상의 수치):</strong>{" "}
          백색소음 집단 평균 16.9점(표준편차 2.4, n=16), 조용한 환경 집단 평균
          14.5점(표준편차 2.6, n=16)
        </p>
      </div>
      <WhyBox>
        무작위 배정은 &ldquo;원래 기억력이 좋은 학생이 한쪽에 몰렸다&rdquo;는
        의심을 차단하는 가장 간단한 장치입니다. 표본이 계획보다 작아진 것을
        숨기지 않고 제한점으로 적기로 한 것도 중요합니다 — 연구의 정직함은
        완벽한 데이터가 아니라 한계를 있는 그대로 보고하는 데서 나옵니다.
      </WhyBox>

      {/* 5단계 */}
      <StageHeading order={5} title="논문화" slug="writing" />
      <div className="card mt-5 px-6 py-5">
        <p className="text-sm text-ink-soft">
          &lsquo;간이 통계 계산기&rsquo;로 독립표본 t-검정을 돌리고, 결과를
          한 줄로 정리했습니다.
        </p>
        <p className="mt-3 rounded-lg bg-surface px-4 py-3 text-xs text-ink-soft">
          도구 출력(Welch 방식이라 자유도가 소수): 평균 차이 = 2.40, d = 0.96;
          t = 2.713, df = 29.8, p = 0.0110
        </p>
        <p className="mt-3 rounded-lg bg-surface px-4 py-3 text-sm text-ink">
          독립표본 t-검정 결과, 백색소음 집단(M=16.9, SD=2.4)이 조용한 환경
          집단(M=14.5, SD=2.6)보다 유의하게 높았다, t(30) = 2.71, p = .011,
          d = 0.96, 평균 차이의 95% CI [0.6, 4.2].
        </p>
        <p className="mt-3 text-sm text-ink-soft">
          d ≈ 0.96은 관례상 큰 효과지만, 표본이 작아 신뢰구간이 0.6점에서
          4.2점까지로 넓습니다 — 실제 효과가 작을 가능성도 남겨두고
          해석했습니다. (논문에는 두 집단 크기가 같아 자유도를 정수 30으로
          적었고, Welch 자유도 29.8과 결과 차이는 없습니다. 신뢰구간은 합동
          분산 기준입니다.)
        </p>
        <p className="mt-4 text-sm text-ink-soft">
          집단별 평균은 &lsquo;간이 차트 그리기&rsquo;로 막대그래프를 만들어
          보고, 오차막대는 스프레드시트에서 따로 추가했습니다. 논문 전체는
          IMRaD 구조로 정리했습니다.
        </p>
        <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
          <li>
            <strong className="text-ink">서론(I):</strong> 고등학생 대상
            백색소음 연구의 공백 → 연구질문 제시
          </li>
          <li>
            <strong className="text-ink">방법(M):</strong> 참여자 32명, 무작위
            배정, 두 교시에 걸친 조건 순서 무작위화, 단어 회상 절차, 동의 절차
          </li>
          <li>
            <strong className="text-ink">결과(R):</strong> 위 t-검정 결과와
            그래프 — 해석 없이 수치만
          </li>
          <li>
            <strong className="text-ink">논의(D):</strong> 결과의 의미, 아래
            제한점, 후속 연구 제안
          </li>
        </ul>
        <p className="mt-4 text-sm text-ink-soft">
          <strong className="text-ink">논의에 적은 제한점:</strong> 작은 표본(큰
          효과만 검출 가능)과 단일 학교, 단 한 번만 측정한 단일 회기 설계, 소음
          조건을 참여자와 실험자 모두에게 숨길 수 없었던 맹검 불가, 개인별
          소음 선호를 통제하지 못한 점, 그리고 실험자가 결과를 기대하면서
          진행한 데서 생길 수 있는 실험자 기대 효과.
        </p>
        <p className="mt-4 text-sm text-ink-soft">
          참고문헌은 APA 형식으로 정리했습니다. 예: 김철수, 박영희 (2023).
          청소년의 학습 환경과 집중력. 청소년연구, 15(2), 123-145.{" "}
          <em>(가상의 예시 문헌)</em>
        </p>
      </div>
      <WhyBox>
        결과(R)에는 수치만 쓰고 해석은 논의(D)로 분리하는 것이 IMRaD의
        핵심입니다. 또 p=.011이 &ldquo;백색소음이 항상 효과 있다&rdquo;를
        뜻하지는 않습니다 — 이 표본, 이 과제, 이 조건에서 차이가 우연이라고
        보기 어렵다는 뜻일 뿐입니다. 차이가 얼마나 큰지는 p가 아니라 효과크기
        d와 신뢰구간이 말해주므로 둘을 함께 적고, 논의에서 과장하지 않고
        제한점과 함께 서술했습니다.
      </WhyBox>

      {/* 6단계 */}
      <StageHeading order={6} title="저널 투고" slug="submission" />
      <div className="card mt-5 px-6 py-5">
        <p className="text-sm text-ink-soft">
          &lsquo;투고처 후보 모음&rsquo;에서 청소년 연구를 받는 곳을 골라,
          투고 전 점검을 마쳤습니다.
        </p>
        <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
          <li>✔ 투고 규정의 분량·형식 요건 확인 (&lsquo;분량 체크기&rsquo; 사용)</li>
          <li>✔ 참고문헌 형식 통일 (APA)</li>
          <li>✔ 연구윤리·동의 절차 서술 포함 여부 확인</li>
          <li>
            ✔ AI 도구 사용 내역 공개문 작성 (&lsquo;AI 활용 disclosure 문구
            만들기&rsquo; 사용)
          </li>
          <li>
            ✔ 발표 대비 예상 질문 정리 (&lsquo;예상 질문 뽑기&rsquo; 사용) —
            &ldquo;소음 크기를 왜 50dB로 했나요?&rdquo;, &ldquo;효과크기는
            얼마인가요?&rdquo; 등
          </li>
        </ul>
      </div>
      <WhyBox>
        투고는 논문을 &ldquo;보내는&rdquo; 일이 아니라 &ldquo;남이 심사할 수
        있는 상태로 만드는&rdquo; 일입니다. 형식 요건 미달로 심사 전에
        반려되는 경우가 가장 아까운 탈락이므로, 내용보다 먼저 규정 점검부터
        하는 순서를 택했습니다.
      </WhyBox>

      {/* 마무리 */}
      <div className="mt-14 border-t border-line pt-8">
        <FictionNotice />
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href="/guide"
            className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-bg transition hover:opacity-85"
          >
            내 연구도 1단계부터 시작하기 →
          </Link>
          <Link
            href="/guide/topic"
            className="text-sm text-ink-soft hover:text-ink"
          >
            주제 선정 가이드 보기
          </Link>
        </div>
      </div>
    </article>
  );
}
