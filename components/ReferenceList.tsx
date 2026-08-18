"use client";

import { useEffect, useState } from "react";
import {
  type Reference,
  formatAPA,
  formatIEEE,
  readReferences,
  removeReference,
} from "@/lib/citations";

export function ReferenceList() {
  const [refs, setRefs] = useState<Reference[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setRefs(readReferences());
    setHydrated(true);
  }, []);

  function remove(id: string) {
    setRefs(removeReference(id));
  }

  async function copy(ref: Reference) {
    try {
      await navigator.clipboard.writeText(formatAPA(ref));
      setCopiedId(ref.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // 클립보드 접근 실패 시 무시
    }
  }

  if (!hydrated) return null;

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
                  className="hover:text-ink"
                >
                  {copiedId === ref.id ? "복사됨" : "APA 복사"}
                </button>
                <button
                  type="button"
                  onClick={() => remove(ref.id)}
                  className="hover:text-ink"
                >
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
