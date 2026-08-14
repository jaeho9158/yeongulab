/**
 * Google AdSense 광고 슬롯.
 *
 * 실제 게재를 시작하려면:
 * 1. AdSense 계정 승인 후 `app/layout.tsx`에 로더 스크립트를 추가
 * 2. `NEXT_PUBLIC_ADSENSE_CLIENT_ID` 환경변수에 pub-XXXX ID 설정
 * 3. 이 컴포넌트의 <ins> 태그에 실제 data-ad-slot 값을 채워 넣기
 *
 * 승인 전까지는 자리만 잡아두는 플레이스홀더로 렌더링된다.
 */
export function AdSlot({ label = "광고" }: { label?: string }) {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  if (!clientId) {
    return (
      <div
        aria-hidden
        className="my-8 flex h-24 items-center justify-center rounded-lg border border-dashed border-black/10 text-xs text-black/30 dark:border-white/10 dark:text-white/30"
      >
        {label} 슬롯 (AdSense 승인 후 노출)
      </div>
    );
  }

  return (
    <ins
      className="adsbygoogle my-8 block"
      style={{ display: "block" }}
      data-ad-client={clientId}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
