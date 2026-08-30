import type { Metadata } from "next";
import Link from "next/link";
import { OPERATOR, SITE_CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "연구랩 소개 — 누가, 왜 만들었나",
  description:
    "연구랩은 청소년 연구자를 위한 무료 가이드입니다. 지니어스 클럽 회장 황재호가 만들었습니다. 콘텐츠를 어떤 원칙으로 쓰는지, 여러분의 기록을 어떻게 다루는지 밝힙니다.",
  keywords: ["연구랩 소개", "청소년 연구 가이드", "운영자", "문의", "황재호"],
  authors: [{ name: OPERATOR.name }],
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-ink">소개</h1>
      <p className="mt-4 text-[17px] leading-[1.7] text-ink-soft">
        연구랩은 청소년 연구자가 연구를 처음부터 끝까지 해낼 수 있도록 만든
        무료 가이드입니다. 로그인도, 결제도, 앱 설치도 필요 없습니다.
      </p>

      <section className="mt-10 border-t border-ink pt-7">
        <h2 className="text-xl font-bold tracking-tight text-ink">
          왜 만들었나
        </h2>
        <p className="mt-3 text-[15px] leading-[1.8] text-ink-soft">
          연구를 해보라는 말은 자주 듣지만, 어떻게 하는지는 아무도 알려주지
          않습니다. 주제를 어떻게 좁히는지, 선행연구는 어디서 찾는지, 결과가
          예상과 다르게 나왔을 때 무엇을 해야 하는지 —{" "}
          이런 것들은 대부분 시행착오로 배웁니다. 그 시행착오를 줄여보려고
          만들었습니다.
        </p>
        <p className="mt-3 text-[15px] leading-[1.8] text-ink-soft">
          그래서 이 사이트는 &ldquo;연구란 무엇인가&rdquo;를 길게 설명하는 대신,
          실제로 막히는 지점마다 다음에 할 일을 하나씩 놓아두는 방식으로
          구성했습니다. 6단계 가이드가 순서를 다루고, 자료실이 각 주제를
          깊게 다루고, 21개의 도구가 계산과 점검을 대신합니다.
        </p>
      </section>

      <section className="mt-9 border-t border-line pt-7">
        <h2 className="text-xl font-bold tracking-tight text-ink">
          누가 만들었나
        </h2>
        <p className="mt-3 text-[15px] leading-[1.8] text-ink-soft">
          {OPERATOR.role} {OPERATOR.name}가 직접 기획하고 만들었습니다.
          기관이나 회사가 운영하는 사이트가 아니라 개인이 만든 사이트입니다.
        </p>
        <p className="mt-3 text-[15px] leading-[1.8] text-ink-soft">
          연구를 직접 해본 경험에서 출발했기 때문에, 교과서적인 설명보다
          &ldquo;이 지점에서 실제로 막힌다&rdquo;는 감각을 우선했습니다. 잘못된
          내용이나 더 나은 설명이 있다면 알려주세요. 확인 후 반영합니다.
        </p>
      </section>

      <section className="mt-9 border-t border-line pt-7">
        <h2 className="text-xl font-bold tracking-tight text-ink">
          콘텐츠를 만드는 원칙
        </h2>
        <ul className="mt-3 space-y-3 text-[15px] leading-[1.8] text-ink-soft">
          <li>
            <strong className="text-ink">직접 씁니다.</strong> 모든 본문은
            다른 사이트의 글을 옮기지 않고 직접 작성합니다. 특정 자료를
            참고한 경우에는 본문에 밝힙니다.
          </li>
          <li>
            <strong className="text-ink">확인한 것만 씁니다.</strong> 외부
            링크는 실제로 열어 확인하고, 대회·학술지처럼 정보가 바뀌는 항목은
            &ldquo;공식 공고를 직접 확인하라&rdquo;고 안내합니다. 통계 계산은
            알려진 기준값과 대조해 검증합니다.
          </li>
          <li>
            <strong className="text-ink">단정하지 않습니다.</strong> 연구
            방법에는 정답이 하나가 아닌 경우가 많습니다. 그런 부분은 선택지와
            판단 기준을 함께 제시합니다.
          </li>
          <li>
            <strong className="text-ink">한계를 밝힙니다.</strong> 이 사이트의
            도구는 학습과 점검을 돕는 간이 도구입니다. 정밀한 통계 소프트웨어나
            지도교사의 검토를 대신하지 않습니다.
          </li>
        </ul>
      </section>

      <section className="mt-9 border-t border-line pt-7">
        <h2 className="text-xl font-bold tracking-tight text-ink">
          여러분의 기록은 어디에 저장되나
        </h2>
        <p className="mt-3 text-[15px] leading-[1.8] text-ink-soft">
          체크리스트, 메모, 도구에 입력한 내용은 모두{" "}
          <strong className="text-ink">여러분의 브라우저에만</strong>{" "}
          저장됩니다. 서버로 전송되지 않고, 저희도 볼 수 없습니다. 그래서
          계정이 필요 없고, 대신 브라우저 데이터를 지우면 기록도 사라집니다.
          중요한 내용은 내보내기 기능으로 따로 보관하세요. 자세한 내용은{" "}
          <Link href="/privacy" className="text-accent hover:underline">
            개인정보처리방침
          </Link>
          에 있습니다.
        </p>
      </section>

      <section className="mt-9 border-t border-line pt-7">
        <h2 className="text-xl font-bold tracking-tight text-ink">
          운영 비용과 광고
        </h2>
        <p className="mt-3 text-[15px] leading-[1.8] text-ink-soft">
          연구랩은 무료이며 앞으로도 그럴 예정입니다. 서버 비용을 감당하기
          위해 광고를 넣을 수 있고, 그 경우 본문을 가리지 않는 위치에만
          배치합니다. 광고 때문에 내용을 바꾸거나 특정 상품을 권하지
          않습니다.
        </p>
      </section>

      <section className="mt-9 border-t border-line pt-7">
        <h2 className="text-xl font-bold tracking-tight text-ink">문의</h2>
        <p className="mt-3 text-[15px] leading-[1.8] text-ink-soft">
          오류 제보, 내용 제안, 그 밖의 문의는 아래로 보내주세요. 확인하는
          대로 답장드립니다.
        </p>
        <p className="mt-3 text-[15px] text-ink">
          <a
            href={`mailto:${SITE_CONTACT_EMAIL}`}
            className="text-accent hover:underline"
          >
            {SITE_CONTACT_EMAIL}
          </a>
        </p>
      </section>

      <div className="mt-10 border-t border-ink pt-5">
        <p className="text-sm leading-[1.7] text-ink-soft">
          처음이라면{" "}
          <Link href="/guide" className="text-accent hover:underline">
            6단계 가이드
          </Link>
          부터, 특정 주제가 궁금하다면{" "}
          <Link href="/articles" className="text-accent hover:underline">
            자료실
          </Link>
          을 보세요.
        </p>
      </div>
    </div>
  );
}
