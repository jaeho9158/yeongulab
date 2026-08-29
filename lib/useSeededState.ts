"use client";

import {
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

/**
 * "서버와 같은 초기 렌더 → 마운트 후 저장소에서 시드" 패턴의 공용 훅.
 *
 * localStorage를 읽는 컴포넌트는 SSR 마크업과 첫 클라이언트 렌더가 같아야
 * 하이드레이션이 깨지지 않으므로, 저장값은 마운트 후에만 읽는다. 이 패턴이
 * 컴포넌트마다 복붙돼 있던 것(hydrated 플래그 + effect 안의 동기 setState)을
 * 여기 한 곳으로 모은다.
 *
 * 반환값이 null이면 아직 시드 전(=서버/첫 렌더)이다. 호출부는 null을
 * "hydrated 아님"으로 쓰면 된다. deps가 바뀌면 다시 읽는다(예: slug 변경 시
 * 이전 단계 값이 남지 않게 무조건 재시드).
 */
export function useSeededState<T>(
  load: () => T,
  deps: readonly unknown[] = [],
): [T | null, Dispatch<SetStateAction<T | null>>] {
  const [state, setState] = useState<T | null>(null);

  useEffect(() => {
    // 이 동기 setState는 의도된 것이다: 시드는 마운트/의존성 변경당 정확히
    // 한 번이고, 렌더 두 번(기본값 → 저장값)이 이 패턴의 본질이라 캐스케이드가
    // 아니다. 억제는 프로젝트 전체에서 여기 한 곳뿐이어야 한다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(load());
    // load는 렌더마다 새로 만들어지는 클로저라 deps에 넣지 않는다 —
    // 다시 읽을 조건은 호출부가 deps 인자로 지정한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return [state, setState];
}
