import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllShowcases } from "@/lib/showcase";

export const metadata: Metadata = {
  title: "다른 학생들의 연구 사례",
  description:
    "실제로 연구를 해본 청소년들이 보내온 사례입니다. 어떤 질문을 세웠고, 어떻게 확인했고, 어디서 막혔는지를 그대로 싣습니다.",
  keywords: ["청소년 연구 사례", "탐구보고서 사례", "학생 연구 예시"],
};

export default function ShowcasePage() {
  const showcases = getAllShowcases();

  // 사례가 아직 없으면 페이지를 열지 않는다. 빈 목록 페이지는 읽을거리가
  // 없는 얇은 콘텐츠라 색인에도 사용자에게도 손해다.
  if (showcases.length === 0) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-ink">연구 사례</h1>
      <p className="mt-4 text-[17px] leading-[1.7] text-ink-soft">
        직접 해본 사람의 기록입니다. 완성된 연구만 있는 것이 아니라 중간에
        막힌 이야기도 함께 싣습니다. 잘된 사례보다 막힌 지점이 다음 사람에게
        더 도움이 되기 때문입니다.
      </p>

      <ol className="mt-9 border-b border-line">
        {showcases.map((item) => (
          <li key={item.slug} className="border-t border-line">
            <Link href={`/showcase/${item.slug}`} className="group block py-5">
              <span className="block text-[17px] font-semibold text-ink transition group-hover:text-accent">
                {item.title}
              </span>
              <span className="mt-1.5 block text-sm leading-[1.65] text-ink-soft">
                {item.summary}
              </span>
              <span className="mt-2 block text-xs text-ink-soft">
                {item.schoolLevel} · {item.byline}
              </span>
            </Link>
          </li>
        ))}
      </ol>

      <div className="mt-10 border-t border-ink pt-5">
        <p className="text-sm leading-[1.7] text-ink-soft">
          여러분의 연구도 여기에 실을 수 있습니다.{" "}
          <Link
            href="/guide/submission#tools"
            className="text-accent hover:underline"
          >
            6단계의 &lsquo;내 연구 사례 나누기&rsquo;
          </Link>
          에서 보내주세요.
        </p>
      </div>
    </div>
  );
}
