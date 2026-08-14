/**
 * Google AdSense 광고 슬롯.
 *
 * 실제 게재를 시작하려면:
 * 1. AdSense 계정 승인 후 `app/layout.tsx`에 로더 스크립트를 추가
 * 2. `NEXT_PUBLIC_ADSENSE_CLIENT_ID` 환경변수에 pub-XXXX ID 설정
 * 3. 이 컴포넌트의 <ins> 태그에 실제 data-ad-slot 값을 채워 넣기
 *
 * 승인 전까지는 자리만 잡아두는 플레이스홀더로 렌더링된다.
 *
 * variant:
 * - "bottom": 본문 하단, 가로로 넓은 형태 (모바일/태블릿 기본)
 * - "rail": PC에서 본문 좌우 여백에 세로로 띄우는 스카이스크래퍼 형태
 */
export function AdSlot({
  label = "광고",
  variant = "bottom",
}: {
  label?: string;
  variant?: "bottom" | "rail";
}) {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const sizeClass =
    variant === "rail" ? "h-[600px] w-[160px]" : "my-8 h-24 w-full";

  if (!clientId) {
    return (
      <div
        aria-hidden
        className={`flex items-center justify-center rounded-lg border border-dashed border-line text-center text-xs text-ink-soft/60 ${sizeClass}`}
      >
        {label}
        <br />
        (AdSense 승인 후 노출)
      </div>
    );
  }

  return (
    <ins
      className={`adsbygoogle block ${sizeClass}`}
      style={{ display: "block" }}
      data-ad-client={clientId}
      data-ad-format={variant === "rail" ? "vertical" : "auto"}
      data-full-width-responsive={variant === "rail" ? "false" : "true"}
    />
  );
}
