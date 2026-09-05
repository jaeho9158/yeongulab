"use client";

import { useState } from "react";

import { useSeededState } from "./useSeededState";

/**
 * 저장 실패 시 화면에 띄울 안내 문구.
 *
 * DeadlineTracker가 쓰던 문구를 그대로 가져왔다 — 사이트 안에서 같은 사고를
 * 같은 말로 알려야 사용자가 헷갈리지 않는다.
 */
export const PERSIST_ERROR_MESSAGE =
  "브라우저 저장소에 저장하지 못했습니다(프라이빗 모드나 저장 공간 부족일 수 있어요). 이 내용은 새로고침하면 사라집니다.";

/**
 * localStorage에 자동 저장되는 useState.
 *
 * 도구 컴포넌트의 입력값이 페이지 이동/새로고침에 사라지는 문제를 막는다.
 * 키는 "research-guide:tool:" 프리픽스가 붙으므로 PlanBackup(백업/복원)과
 * DataReset(전체 삭제)의 프리픽스 스캔에 자동으로 포함된다.
 *
 * 저장값은 JSON으로 직렬화한다. 파싱 실패·형태 불일치 시 initial로 폴백.
 *
 * 세 번째 반환값(saveError)은 setItem이 실패했을 때의 안내 문구다. 왜 튜플
 * 뒤에 덧붙였나 — 이 훅을 쓰는 컴포넌트가 20개가 넘어서, 객체 반환으로
 * 바꾸면 호출부를 전부 고쳐야 한다. 선택적 세 번째 원소는 기존
 * `const [v, setV] = usePersistentState(...)` 구조분해를 그대로 두고,
 * 표시할 컴포넌트만 하나씩 꺼내 쓸 수 있다.
 *
 * 읽기 실패는 노출하지 않는다 — 저장된 게 없는 정상 상태와 구분되지 않아
 * 경고를 띄우면 오히려 잘못된 안내가 된다.
 */
export function usePersistentState<T>(
  key: string,
  initial: T,
): [T, (value: T | ((prev: T) => T)) => void, string | null] {
  const storageKey = `research-guide:tool:${key}`;
  // initial이 인라인 객체/배열이어도 첫 렌더 값으로 고정한다
  // (ref는 렌더 중 접근이 금지라 useState의 초기값 고정을 이용)
  const [initialValue] = useState(initial);
  const [saveError, setSaveError] = useState<string | null>(null);

  // 시드 전(null)에는 initial을 보여준다. T 자체에 null이 오는 용도는 지원하지
  // 않는다(도구 입력값은 문자열·객체뿐).
  const [seeded, setSeeded] = useSeededState<T>(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw !== null) {
        const parsed = JSON.parse(raw) as T;
        // 저장된 값과 초기값의 대분류(typeof)가 다르면 손상으로 보고 무시
        if (typeof parsed === typeof initialValue) return parsed;
      }
    } catch {
      // localStorage 접근 불가(프라이빗 모드 등) 또는 파싱 실패 — 기본값 유지
    }
    return initialValue;
  }, [storageKey]);
  const value = seeded ?? initialValue;

  function set(next: T | ((prev: T) => T)) {
    setSeeded((prev) => {
      const base = prev ?? initialValue;
      const resolved =
        typeof next === "function" ? (next as (p: T) => T)(base) : next;
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(resolved));
        // 저장에 성공하면 이전 경고를 걷는다(저장 공간을 비운 뒤 등)
        setSaveError(null);
      } catch {
        // 조용히 넘기면 화면은 멀쩡한데 새로고침에 전부 사라진다
        setSaveError(PERSIST_ERROR_MESSAGE);
      }
      return resolved;
    });
  }

  return [value, set, saveError];
}
