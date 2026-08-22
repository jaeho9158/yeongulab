export type Reference = {
  id: string;
  authors: string;
  year: string;
  title: string;
  source: string;
  volume?: string;
  issue?: string;
  pages?: string;
  url?: string;
};

export function formatAPA(ref: Omit<Reference, "id">): string {
  return [
    ref.authors && `${ref.authors} `,
    // APA 관례상 연도가 없으면 (n.d.)로 표기한다
    `(${ref.year || "n.d."}). `,
    ref.title && `${ref.title}. `,
    ref.source &&
      `${ref.source}${ref.volume ? `, ${ref.volume}` : ""}${ref.issue ? `(${ref.issue})` : ""}${ref.pages ? `, ${ref.pages}` : ""}. `,
    ref.url,
  ]
    .filter(Boolean)
    .join("");
}

export function formatIEEE(ref: Omit<Reference, "id">): string {
  const joined = [
    ref.authors && `${ref.authors}, `,
    ref.title && `"${ref.title}," `,
    ref.source && `${ref.source}, `,
    ref.volume && `vol. ${ref.volume}, `,
    ref.issue && `no. ${ref.issue}, `,
    ref.pages && `pp. ${ref.pages}, `,
    ref.year && `${ref.year}.`,
  ]
    .filter(Boolean)
    .join("");
  // 연도가 비어 있으면 ", "로 끝나므로 꼬리 구분자를 정리하고 마침표로 마무리
  const trimmed = joined.replace(/[,\s]+$/, "");
  if (!trimmed) return "";
  return trimmed.endsWith(".") ? trimmed : `${trimmed}.`;
}

/** crypto.randomUUID는 비보안 컨텍스트(http LAN 미리보기 등)에서 없을 수 있다. */
function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export const REFERENCES_STORAGE_KEY = "research-guide:references";

export function readReferences(): Reference[] {
  try {
    const raw = window.localStorage.getItem(REFERENCES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addReference(ref: Omit<Reference, "id">): Reference[] {
  const next = [...readReferences(), { ...ref, id: generateId() }];
  try {
    window.localStorage.setItem(REFERENCES_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // 저장 실패해도 호출부에서 받은 next는 그대로 반환
  }
  return next;
}

export function removeReference(id: string): Reference[] {
  const next = readReferences().filter((r) => r.id !== id);
  try {
    window.localStorage.setItem(REFERENCES_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // 저장 실패해도 무시
  }
  return next;
}
