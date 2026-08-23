const LOG_KEY = "research-guide:activity-log";
const MAX_ENTRIES = 2000;

export type ActivityType =
  | "NOTE"
  | "STAGE_ITEM_DONE"
  | "REFLECTION"
  | "STAGE_COMPLETE";

export type ActivityEntry = {
  type: ActivityType;
  refId: string;
  occurredAt: string;
};

export function logActivity(entry: Omit<ActivityEntry, "occurredAt">): void {
  try {
    const log = getActivityLog();
    log.push({ ...entry, occurredAt: new Date().toISOString() });
    const trimmed =
      log.length > MAX_ENTRIES ? log.slice(log.length - MAX_ENTRIES) : log;
    window.localStorage.setItem(LOG_KEY, JSON.stringify(trimmed));
  } catch {
    // 저장 실패해도 앱 동작에는 영향 없음
  }
}

export function getActivityLog(): ActivityEntry[] {
  try {
    const raw = window.localStorage.getItem(LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as ActivityEntry[];
  } catch {
    return [];
  }
}

// 히트맵 등 날짜 표시가 사용자의 로컬 날짜 기준이 되도록 공용 포매터를 둔다
// (toISOString은 UTC 기준이라 자정 전후로 하루가 어긋난다)
export function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getActivityByDay(): Record<string, number> {
  const log = getActivityLog();
  const byDay: Record<string, number> = {};
  for (const entry of log) {
    // 저장된 시각(UTC)을 로컬 날짜로 변환해 집계 — 화면의 날짜 키와 일치시킨다
    const day = toLocalDateKey(new Date(entry.occurredAt));
    byDay[day] = (byDay[day] ?? 0) + 1;
  }
  return byDay;
}

// firstAt/lastAt은 ISO(UTC) 문자열 — 날짜로 표시할 때는 toLocalDateKey(new Date(...))를 쓸 것
export function getStageDurations(
  stages: { slug: string }[],
): Record<string, { firstAt: string | null; lastAt: string | null; days: number | null }> {
  const log = getActivityLog();
  const result: Record<
    string,
    { firstAt: string | null; lastAt: string | null; days: number | null }
  > = {};

  for (const stage of stages) {
    const prefix = `${stage.slug}:`;
    const related = log.filter((e) => e.refId.startsWith(prefix) || e.refId === stage.slug);
    if (related.length === 0) {
      result[stage.slug] = { firstAt: null, lastAt: null, days: null };
      continue;
    }
    const times = related.map((e) => new Date(e.occurredAt).getTime()).sort((a, b) => a - b);
    const firstAt = new Date(times[0]).toISOString();
    const lastAt = new Date(times[times.length - 1]).toISOString();
    const days = Math.max(
      0,
      Math.round((times[times.length - 1] - times[0]) / (1000 * 60 * 60 * 24)),
    );
    result[stage.slug] = { firstAt, lastAt, days };
  }

  return result;
}
