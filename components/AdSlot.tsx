"use client";

import { useEffect } from "react";

/**
 * Google AdSense 광고 슬롯.
 *
 * 로더 스크립트(adsbygoogle.js)는 `app/layout.tsx`에서 항상 싣는다(소유권
 * 확인용). 실제 광고 단위는 `NEXT_PUBLIC_ADSENSE_CLIENT_ID`가 설정된 경우에만
 * 렌더링되고, 비어 있으면 아무것도 그리지 않는다 — 승인 전 빈 점선 박스가
 * 본문에 노출되는 일을 막기 위해서다.
 *
 * 사용법: AdSense에서 광고 단위를 만든 뒤 `slot` prop에 data-ad-slot 값을
 * 넘긴다(없으면 client ID만으로 렌더링).
 *
 * variant:
 * - "bottom": 본문 하단, 가로로 넓은 형태 (모바일/태블릿 기본)
 * - "rail": PC에서 본문 좌우 여백에 세로로 띄우는 스카이스크래퍼 형태
 */

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function AdSlot({
  label = "광고",
  variant = "bottom",
  slot,
}: {
  label?: string;
  variant?: "bottom" | "rail";
  slot?: string;
}) {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const sizeClass =
    variant === "rail" ? "h-[600px] w-[160px]" : "my-8 h-24 w-full";

  useEffect(() => {
    if (!clientId) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // 로더가 아직 없거나 차단된 경우 — 광고만 비고 페이지는 정상 동작
    }
  }, [clientId]);

  if (!clientId) return null;

  return (
    <ins
      className={`adsbygoogle block ${sizeClass}`}
      style={{ display: "block" }}
      aria-label={label}
      data-ad-client={clientId}
      data-ad-slot={slot}
      data-ad-format={variant === "rail" ? "vertical" : "auto"}
      data-full-width-responsive={variant === "rail" ? "false" : "true"}
    />
  );
}
