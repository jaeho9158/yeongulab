"use client";

import { useEffect, useRef, useState } from "react";

/**
 * localStorage에 자동 저장되는 useState.
 *
 * 도구 컴포넌트의 입력값이 페이지 이동/새로고침에 사라지는 문제를 막는다.
 * 키는 "research-guide:tool:" 프리픽스가 붙으므로 PlanBackup(백업/복원)과
 * DataReset(전체 삭제)의 프리픽스 스캔에 자동으로 포함된다.
 *
 * 저장값은 JSON으로 직렬화한다. 파싱 실패·형태 불일치 시 initial로 폴백.
 */
export function usePersistentState<T>(
  key: string,
  initial: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const storageKey = `research-guide:tool:${key}`;
  const [value, setValue] = useState<T>(initial);
  // initial이 인라인 객체/배열이어도 마운트 시 1회만 읽도록 ref로 고정
  const initialRef = useRef(initial);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw !== null) {
        const parsed = JSON.parse(raw) as T;
        // 저장된 값과 초기값의 대분류(typeof)가 다르면 손상으로 보고 무시
        if (typeof parsed === typeof initialRef.current) {
          setValue(parsed);
        }
      }
    } catch {
      // localStorage 접근 불가(프라이빗 모드 등) 또는 파싱 실패 — 기본값 유지
    }
  }, [storageKey]);

  function set(next: T | ((prev: T) => T)) {
    setValue((prev) => {
      const resolved =
        typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(resolved));
      } catch {
        // 저장 실패해도 화면 상태는 유지
      }
      return resolved;
    });
  }

  return [value, set];
}
