"use client";

const PREFIX = "research-guide:";
// 테마는 화면 설정이지 '기록'이 아니므로 남겨둔다
const THEME_KEY = "research-guide:theme";

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
        if (key && key.startsWith(PREFIX) && key !== THEME_KEY) keys.push(key);
      }
      keys.forEach((key) => window.localStorage.removeItem(key));
    } catch {
      // 접근 불가 시 무시
    }
    window.location.reload();
  }

  return (
    <section className="grid items-center gap-4 border-t border-line py-[18px] sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-6">
      <div>
        <h3 className="text-[15px] font-semibold text-ink">내 기록 전부 삭제</h3>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
          체크리스트, 메모, 레퍼런스, 활동 기록 등 이 브라우저에 저장된 모든
          기록을 삭제합니다.
        </p>
      </div>
      <button
        type="button"
        onClick={resetAll}
        className="w-fit rounded-lg border border-line px-3.5 py-2 text-xs font-medium whitespace-nowrap text-red-600 transition hover:border-red-600"
      >
        전부 삭제하기
      </button>
    </section>
  );
}
