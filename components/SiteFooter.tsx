import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-ink">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm text-ink-soft">
          연구랩 가이드는 청소년 연구자를 위한 무료 로드맵입니다. 언제든
          막힌 단계로 바로 돌아와 다시 봐도 괜찮습니다.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 font-label text-xs text-ink-soft">
          <span>© {new Date().getFullYear().toString()} 연구랩 가이드</span>
          <div className="flex items-center gap-1">
            <Link
              href="/privacy"
              className="-my-3.5 flex items-center py-3.5 pr-3 hover:text-ink"
            >
              개인정보처리방침
            </Link>
            <Link
              href="/guide"
              className="-my-3.5 flex items-center py-3.5 pl-3 hover:text-ink"
            >
              6단계 가이드 →
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
