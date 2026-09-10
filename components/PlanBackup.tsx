"use client";

import { useRef, useState } from "react";

const PREFIX = "research-guide:";
// 테마는 기기별 화면 설정이지 '기록'이 아니므로 백업·복원에서 제외한다
const THEME_KEY = "research-guide:theme";
const BACKUP_VERSION = 2;
const MAX_FILE_BYTES = 2 * 1024 * 1024;

const GENERIC_ERROR =
  "파일을 읽지 못했습니다. 이 사이트에서 내려받은 백업 파일이 맞는지 확인해주세요.";
// 쓰기가 중간에 실패했지만 스냅샷으로 되돌린 경우 — 기록은 그대로다
const RESTORE_ROLLED_BACK =
  "복원에 실패해 기존 기록을 그대로 되돌렸습니다. 저장 공간이 부족하거나 프라이빗 모드일 수 있습니다.";
// 롤백조차 실패한 경우 — 이 문구만이 사용자에게 손실 가능성을 알린다.
// 지우지 마라(K1): 롤백 첫 루프가 실패하면 공간이 안 비어 둘째 루프도 터진다.
const RESTORE_CORRUPTED =
  "복원에 실패했고 기존 기록이 손상됐을 수 있습니다. 이 페이지를 새로고침하지 말고, 먼저 '백업 파일 내려받기'로 지금 상태를 저장해두세요.";

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

  /** persist=true면 자동으로 사라지지 않는다(데이터 손실 안내는 놓치면 안 된다). */
  function fail(message: string, persist = false) {
    setErrorMessage(message);
    setStatus("error");
    if (!persist) setTimeout(() => setStatus("idle"), 3000);
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

      // '덮어씁니다'라는 안내대로 기존 기록을 지우고 파일 내용만 남기되,
      // 지우기 전에 전체를 메모리에 뜬다. 쓰기 루프가 중간에 실패하면 이
      // 스냅샷으로 되돌린다 — 아니면 한 학기 기록이 사라진 채 "파일을 읽지
      // 못했습니다"라는 엉뚱한 안내만 남는다(K1).
      //
      // 잔여 위험: collectData()는 getItem 실패를 삼키므로, 일부 키만 읽기가
      // 막힌 환경에서는 그 키가 스냅샷에 없고 지워진 뒤 복구되지 않는다.
      // 롤백으로 막을 수 없는 경우다.
      const snapshot = collectData();
      const oldKeys = Object.keys(snapshot);

      try {
        for (const key of oldKeys) window.localStorage.removeItem(key);
        for (const [key, value] of entries) {
          window.localStorage.setItem(key, value);
        }
      } catch {
        // 롤백: 새로 쓴 것을 걷어내고 스냅샷을 되돌린다.
        // 순서가 중요하다 — entries와 snapshot에 같은 키가 겹치면 먼저 지우고
        // 다시 써야 원래 값이 남는다.
        try {
          for (const [key] of entries) window.localStorage.removeItem(key);
          for (const [key, value] of Object.entries(snapshot)) {
            window.localStorage.setItem(key, value);
          }
          fail(RESTORE_ROLLED_BACK, true);
        } catch {
          fail(RESTORE_CORRUPTED, true);
        }
        // 여기서 reload()를 부르면 안 된다 — 사용자가 현 상태를 백업할 기회를 잃는다.
        return;
      }

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
          파일로 백업해두면 다른 기기나 브라우저에서 불러와 이어서 쓸 수 있습니다.
        </p>
        {status === "error" && (
          <p className="mt-2 text-xs text-danger" role="alert">
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
