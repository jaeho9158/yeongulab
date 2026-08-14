import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-rule-strong/60">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="font-display text-sm text-ink-soft">
          연구랩 가이드는 청소년 연구자를 위한 무료 로드맵입니다. 언제든
          막힌 단계로 바로 돌아와 다시 봐도 괜찮습니다.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 font-label text-[11px] uppercase tracking-widest text-ink-soft">
          <span>
            © {new Date().getFullYear().toString()} 연구랩 가이드
          </span>
          <Link href="/guide" className="hover:text-stamp">
            6단계 가이드 →
          </Link>
        </div>
      </div>
    </footer>
  );
}
