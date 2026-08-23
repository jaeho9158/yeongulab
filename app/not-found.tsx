import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없음",
};

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <p className="font-label text-xs tracking-wider text-accent">404</p>
      <h1 className="mt-2.5 text-3xl font-bold tracking-tight text-ink">
        페이지를 찾을 수 없습니다
      </h1>
      <p className="mt-3 max-w-xl text-[15px] leading-[1.7] text-ink-soft">
        주소가 바뀌었거나 잘못 입력되었을 수 있습니다. 아래에서 원하는 곳으로
        이동해보세요.
      </p>
      <div className="mt-8 flex flex-wrap gap-2">
        <Link
          href="/"
          className="rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-bg transition hover:opacity-85"
        >
          홈으로
        </Link>
        <Link
          href="/guide"
          className="rounded-lg border border-line px-5 py-2.5 text-sm font-medium text-ink transition hover:border-accent"
        >
          6단계 가이드 보기
        </Link>
      </div>
    </div>
  );
}
