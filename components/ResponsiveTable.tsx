"use client";

import { useEffect, useRef } from "react";

/**
 * mdx 표를 감싸는 래퍼. md(768px) 미만에서는 각 행을 세로 카드로 쌓고
 * 셀마다 그 열의 제목을 라벨로 붙여, 넓은 표도 가로 스크롤 없이 읽히게 한다
 * (CSS는 app/globals.css의 .responsive-table 규칙 참고).
 *
 * 라벨은 마크다운을 다시 파싱하지 않고 렌더된 DOM에서 thead th 텍스트를
 * 그대로 옮겨온다 — 표마다 별도 매핑을 만들 필요가 없고, 표 내용이 바뀌어도
 * 항상 실제 헤더와 일치한다.
 *
 * md 이상에서는 표가 본문 폭에 맞춰 줄바꿈된다. 예전에는 여기에 md:min-w-max를
 * 붙였는데, 그건 min-width를 max-content로 만들어 셀 안의 긴 문장이 **줄바꿈을
 * 아예 못 하게** 했다. 그래서 3열짜리 표도 본문 폭(max-w-3xl)을 넘겨 가로
 * 스크롤이 생겼다. 폭을 강제하지 않아야 표가 화면 안에 들어온다.
 * overflow-x-auto는 그래도 안 되는 경우(열이 아주 많은 표)를 위한 안전망으로 남긴다.
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

  return (
    <div ref={wrapRef} className="responsive-table overflow-x-auto">
      <table {...props} />
    </div>
  );
}
