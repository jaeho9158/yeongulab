"use client";

import { useEffect, useRef } from "react";

/**
 * mdx 표를 감싸는 래퍼. md(768px) 미만에서는 각 행을 세로 카드로 쌓고
 * 셀마다 그 열의 제목을 라벨로 붙여, 넓은 표도 가로 스크롤 없이 읽히게 한다
 * (CSS는 app/globals.css의 .responsive-table 규칙 참고).
 *
 * 라벨은 마크다운을 다시 파싱하지 않고 렌더된 DOM에서 thead th 텍스트를
 * 그대로 옮겨온다 — 표마다 별도 매핑을 만들 필요가 없고, 표 내용이 바뀌어도
 * 항상 실제 헤더와 일치한다. md 이상에서는 평소 표 그대로 보여주고,
 * 그래도 넘치는 표(예: 6열 이상)는 overflow-x-auto로 마지막 안전망을 둔다.
 */
export function ResponsiveTable(
  props: React.TableHTMLAttributes<HTMLTableElement>,
) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const table = wrapRef.current?.querySelector("table");
    if (!table) return;
    const headers = Array.from(table.querySelectorAll("thead th")).map(
      (th) => th.textContent?.trim() ?? "",
    );
    table.querySelectorAll("tbody tr").forEach((tr) => {
      Array.from(tr.children).forEach((cell, i) => {
        // 빈 헤더(표의 첫 칸이 행 이름 역할만 하는 경우)는 라벨을 달지
        // 않는다 — CSS가 라벨 없는 첫 칸을 굵게 표시해 대신한다.
        if (headers[i]) cell.setAttribute("data-label", headers[i]);
      });
    });
  }, [props.children]);

  const { className, ...rest } = props;

  return (
    <div ref={wrapRef} className="responsive-table overflow-x-auto">
      <table
        {...rest}
        className={className ? `md:min-w-max ${className}` : "md:min-w-max"}
      />
    </div>
  );
}
