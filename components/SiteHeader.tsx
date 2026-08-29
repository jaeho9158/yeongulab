import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { ThemeToggle } from "@/components/ThemeToggle";

export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex h-14 max-w-[60rem] items-center gap-1 px-4">
        <Link
          href="/"
          className="mr-1 flex h-14 shrink-0 items-center gap-2 text-lg font-bold tracking-tight text-ink"
        >
          <svg
            viewBox="0 0 20 20"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className="text-accent"
          >
            <path d="M4 3h12v14H4z" />
            <path d="M7 7h6M7 10h6M7 13h4" />
          </svg>
          {/* 좁은 폭에서는 워드마크를 감춰 메뉴 폭을 확보한다.
              sr-only로 남겨 링크의 접근성 이름은 항상 "연구랩"이다. */}
          <span className="sr-only sm:not-sr-only">연구랩</span>
        </Link>
        {/* 메뉴가 화면을 넘치면(아주 좁은 폭) 가로로 밀어 볼 수 있게 둔다.
            테마 토글은 내비게이션이 아니고 항상 눌러야 하므로 밖에 뺀다. */}
        {/* justify-end가 아니라 첫 항목의 ml-auto로 오른쪽 정렬한다 —
            justify-end는 폭이 모자랄 때 항목이 '왼쪽으로' 넘쳐 스크롤로도
            닿을 수 없게 만든다(320px에서 재현). auto 마진은 여유가 없으면
            0이 되어 넘침이 오른쪽으로 가므로 밀어서 볼 수 있다. */}
        <nav
          aria-label="주요 메뉴"
          className="nav-scroll flex min-w-0 flex-1 items-center gap-1 overflow-x-auto text-sm [&>:first-child]:ml-auto"
        >
          <SiteNav />
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
