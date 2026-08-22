"use client";

import { useRef, useState } from "react";

const PREFIX = "research-guide:";

function collectData(): Record<string, string> {
  const data: Record<string, string> = {};
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(PREFIX)) {
        const value = window.localStorage.getItem(key);
        if (value !== null) data[key] = value;
      }
    }
  } catch {
    // localStorage 접근 불가 — 빈 데이터로 진행
  }
  return data;
}

export function PlanBackup() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "exported" | "imported" | "error">(
    "idle",
  );

  function handleExport() {
    const data = collectData();
    const payload = JSON.stringify(
      { exportedAt: new Date().toISOString(), data },
      null,
      2,
    );
    const blob = new Blob([payload], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "연구-진행-백업.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatus("exported");
    setTimeout(() => setStatus("idle"), 2000);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    // 기존 기록을 덮어쓰는 작업이므로 사용자 확인을 먼저 받는다
    if (
      !window.confirm(
        "백업 파일의 기록으로 이 기기의 현재 기록을 덮어씁니다. 계속할까요?",
      )
    ) {
      return;
    }
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as { data?: Record<string, string> };
      const data = parsed.data;
      if (!data || typeof data !== "object") throw new Error("invalid format");
      for (const [key, value] of Object.entries(data)) {
        if (key.startsWith(PREFIX) && typeof value === "string") {
          window.localStorage.setItem(key, value);
        }
      }
      setStatus("imported");
      setTimeout(() => window.location.reload(), 800);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  return (
    <section className="grid items-center gap-4 border-t border-line py-[18px] sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-6">
      <div>
        <h3 className="text-[15px] font-semibold text-ink">다른 기기로 옮기기</h3>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
          파일로 백업해두면 다른 기기·브라우저에서 불러와 이어갈 수 있습니다.
        </p>
        {status === "error" && (
          <p className="mt-2 text-xs text-red-600">
            파일을 읽지 못했습니다. 이 사이트에서 내려받은 백업 파일이 맞는지
            확인해주세요.
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleExport}
          className="rounded-lg border border-line px-3.5 py-2 text-[13px] font-medium whitespace-nowrap text-ink transition hover:border-accent"
        >
          {status === "exported" ? "내려받음" : "백업 파일 내려받기"}
        </button>
        <button
          type="button"
          onClick={handleImportClick}
          className="rounded-lg border border-line px-3.5 py-2 text-[13px] font-medium whitespace-nowrap text-ink transition hover:border-accent"
        >
          {status === "imported" ? "불러오는 중..." : "백업 파일 불러오기"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </section>
  );
}
