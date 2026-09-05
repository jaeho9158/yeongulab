"use client";

import { useEffect, useState } from "react";
import { useSeededState } from "@/lib/useSeededState";
import { COPY_FAILED_MESSAGE } from "@/lib/clipboard";
import {
  type Reference,
  formatAPA,
  formatIEEE,
  readReferences,
  removeReference,
} from "@/lib/citations";

export function ReferenceList() {
  const [seeded, setRefs] = useSeededState<Reference[]>(readReferences);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copyFailed, setCopyFailed] = useState(false);
  const refs = seeded ?? [];

  useEffect(() => {
    // 같은 페이지의 저장 이벤트 + 다른 탭의 storage 변경을 반영
    function reload() {
      setRefs(readReferences());
    }
    window.addEventListener("research-guide:references-updated", reload);
    window.addEventListener("storage", reload);
    return () => {
      window.removeEventListener("research-guide:references-updated", reload);
      window.removeEventListener("storage", reload);
    };
  }, [setRefs]);

  function remove(id: string) {
    setRefs(removeReference(id));
  }

  async function copy(ref: Reference) {
    try {
      await navigator.clipboard.writeText(formatAPA(ref));
      setCopyFailed(false);
      setCopiedId(ref.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // 인용 형식은 실패를 모른 채 붙여넣으면 엉뚱한 출처가 보고서에 들어간다
      setCopyFailed(true);
    }
  }

  if (seeded === null) return null;

  return (
    <section className="card mt-10 px-5 py-5 sm:px-6 sm:py-6">
      <h2 className="text-lg font-bold text-ink">내 레퍼런스 목록</h2>
      <p className="mt-1 text-sm text-ink-soft">
        선행연구 검색이나 인용 형식 도구에서 저장한 논문들입니다. 이 기기의
        브라우저에만 저장됩니다.
      </p>

      {refs.length === 0 ? (
        <p className="mt-4 text-sm text-ink-soft">
          아직 저장된 레퍼런스가 없습니다. 위 검색 결과나 인용 형식 도구에서
          &quot;저장&quot;을 눌러보세요.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {refs.map((ref) => (
            <li
              key={ref.id}
              className="rounded-lg border border-line px-4 py-3"
            >
              <p className="text-sm text-ink">{formatAPA(ref)}</p>
              <p className="mt-1 text-xs text-ink-soft">{formatIEEE(ref)}</p>
              <div className="mt-2 flex gap-3 text-xs text-ink-soft">
                <button
                  type="button"
                  onClick={() => copy(ref)}
                  className="-mx-1 -my-2 px-3 py-2 hover:text-ink"
                >
                  {copiedId === ref.id ? "복사됨" : "APA 복사"}
                </button>
                <button
                  type="button"
                  onClick={() => remove(ref.id)}
                  aria-label={`${ref.title} 삭제`}
                  className="-mx-1 -my-2 px-3 py-2 hover:text-ink"
                >
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p aria-live="polite" className="mt-3 text-xs text-ink-soft">
        {copyFailed && COPY_FAILED_MESSAGE}
      </p>
    </section>
  );
}
