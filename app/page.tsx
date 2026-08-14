import Link from "next/link";
import { getAllStages } from "@/lib/guide";

export default function Home() {
  const stages = getAllStages();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">
        연구, 어디서부터 시작해야 할지 모르겠다면
      </h1>
      <p className="mt-4 text-black/70 dark:text-white/70">
        청소년 연구자를 위한 무료 로드맵입니다. 주제 선정부터 논문 투고까지
        6단계로 나눠, 각 단계에서 무엇을 하면 되는지 안내합니다.
      </p>

      <Link
        href="/guide"
        className="mt-8 inline-block rounded-full bg-black px-6 py-3 text-sm font-medium text-white dark:bg-white dark:text-black"
      >
        6단계 가이드 보기
      </Link>

      <ol className="mt-12 space-y-3">
        {stages.map((stage) => (
          <li key={stage.slug}>
            <Link
              href={`/guide/${stage.slug}`}
              className="flex items-baseline gap-3 rounded-lg border border-black/10 px-4 py-3 hover:bg-black/[.03] dark:border-white/10 dark:hover:bg-white/[.05]"
            >
              <span className="text-xs text-black/40 dark:text-white/40">
                {String(stage.order).padStart(2, "0")}
              </span>
              <span className="font-medium">{stage.title}</span>
              <span className="ml-auto text-xs text-black/40 dark:text-white/40">
                {stage.estimatedWeeks}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
