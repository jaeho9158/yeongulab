"use client";

import { useRef, useState } from "react";

const PREFIX = "research-guide:";
// 테마는 기기별 화면 설정이지 '기록'이 아니므로 백업·복원에서 제외한다
const THEME_KEY = "research-guide:theme";
const BACKUP_VERSION = 2;
const MAX_FILE_BYTES = 2 * 1024 * 1024;

const GENERIC_ERROR =
  "파일을 읽지 못했습니다. 이 사이트에서 내려받은 백업 파일이 맞는지 확인해주세요.";

function listRecordKeys(): string[] {
  const keys: string[] = [];
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(PREFIX) && key !== THEME_KEY) keys.push(key);
    }
  } catch {
    // localStorage 접근 불가 — 빈 목록으로 진행
  }
  return keys;
}

function collectData(): Record<string, string> {
  const data: Record<string, string> = {};
  for (const key of listRecordKeys()) {
    try {
      const value = window.localStorage.getItem(key);
      if (value !== null) data[key] = value;
    } catch {
      // 개별 키 읽기 실패는 건너뛴다 — 읽을 수 있는 것만 내보낸다
    }
  }
  return data;
}

export function PlanBackup() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "exported" | "imported" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState(GENERIC_ERROR);

  function handleExport() {
    const data = collectData();
    const payload = JSON.stringify(
      { version: BACKUP_VERSION, exportedAt: new Date().toISOString(), data },
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

  function fail(message: string) {
    setErrorMessage(message);
    setStatus("error");
    setTimeout(() => setStatus("idle"), 3000);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      fail("파일이 너무 큽니다");
      return;
    }
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
      const parsed = JSON.parse(text) as {
        version?: unknown;
        data?: unknown;
      };
      // 버전 없는 파일은 v1(초기 형식)로 본다. 더 새로운 형식은 읽지 않는다.
      const version = typeof parsed.version === "number" ? parsed.version : 1;
      if (version > BACKUP_VERSION) throw new Error("unsupported version");
      const data = parsed.data;
      if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("invalid format");
      }
      const entries = Object.entries(data as Record<string, unknown>).filter(
        ([key, value]) =>
          key.startsWith(PREFIX) && key !== THEME_KEY && typeof value === "string",
      ) as [string, string][];
      if (entries.length === 0) throw new Error("empty backup");

      // '덮어씁니다'라는 안내대로, 기존 기록은 지우고 파일 내용만 남긴다
      for (const key of listRecordKeys()) window.localStorage.removeItem(key);
      for (const [key, value] of entries) window.localStorage.setItem(key, value);

      setStatus("imported");
      setTimeout(() => window.location.reload(), 800);
    } catch {
      fail(GENERIC_ERROR);
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
          <p className="mt-2 text-xs text-red-600" role="alert">
            {errorMessage}
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
