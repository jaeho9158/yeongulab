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
    ref.year && `(${ref.year}). `,
    ref.title && `${ref.title}. `,
    ref.source &&
      `${ref.source}${ref.volume ? `, ${ref.volume}` : ""}${ref.issue ? `(${ref.issue})` : ""}${ref.pages ? `, ${ref.pages}` : ""}. `,
    ref.url,
  ]
    .filter(Boolean)
    .join("");
}

export function formatIEEE(ref: Omit<Reference, "id">): string {
  return [
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
  const next = [...readReferences(), { ...ref, id: crypto.randomUUID() }];
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
