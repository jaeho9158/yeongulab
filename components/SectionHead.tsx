import type { ReactNode } from "react";

/**
 * 괘선 섹션 머리글 — 잉크색 밑줄 위에 제목(왼쪽)과 모노 메타(오른쪽).
 * 홈 하단 '차례', 가이드 목록, 활동 기록 페이지가 같은 리듬을 쓴다.
 */
export function SectionHead({
  title,
  meta,
  serif = false,
  as: Tag = "h2",
}: {
  title: ReactNode;
  meta?: ReactNode;
  serif?: boolean;
  as?: "h2" | "h3";
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-ink pb-3">
      <Tag
        className={
          serif
            ? "font-serif text-xl font-semibold text-ink"
            : "text-lg font-bold text-ink"
        }
      >
        {title}
      </Tag>
      {meta && (
        <span className="font-label text-[11px] tracking-wider text-ink-soft">
          {meta}
        </span>
      )}
    </div>
  );
}
