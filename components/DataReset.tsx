"use client";

const PREFIX = "research-guide:";

export function DataReset() {
  function resetAll() {
    const ok = window.confirm(
      "이 사이트가 이 브라우저에 저장한 모든 기록을 삭제합니다. 되돌릴 수 없습니다. 계속할까요?",
    );
    if (!ok) return;
    try {
      const keys: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith(PREFIX)) keys.push(key);
      }
      keys.forEach((key) => window.localStorage.removeItem(key));
    } catch {
      // 접근 불가 시 무시
    }
    window.location.reload();
  }

  return (
    <section className="card mt-10 px-5 py-5 sm:px-6 sm:py-6">
      <h2 className="text-lg font-bold text-ink">내 기록 전부 삭제</h2>
      <p className="mt-1 text-sm text-ink-soft">
        이 사이트가 이 브라우저에 저장한 모든 기록(체크리스트, 메모,
        레퍼런스, 활동 기록 등)을 삭제합니다.
      </p>
      <button
        type="button"
        onClick={resetAll}
        className="mt-4 rounded-lg border border-line px-4 py-2 text-xs font-medium text-red-600 transition hover:border-red-600"
      >
        전부 삭제하기
      </button>
    </section>
  );
}
