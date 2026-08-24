import { ViewTransition } from "react";

// 페이지 이동마다 감싸는 얕은 크로스페이드 + 살짝 떠오르는 진입.
// template.tsx는 layout과 달리 내비게이션마다 다시 마운트되므로, 여기 감싸두면
// 모든 라우트 전환에 자동으로 적용된다(헤더/푸터는 layout에 있어 움직이지 않음).
// prefers-reduced-motion은 globals.css에서 애니메이션 지속시간을 0으로 낮춘다.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      {children}
    </ViewTransition>
  );
}
