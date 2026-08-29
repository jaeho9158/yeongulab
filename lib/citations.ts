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

/** 제목이 이미 . ? ! 로 끝나면 마침표를 겹쳐 붙이지 않는다 ("Study.." 방지). */
function titleWithPeriod(title: string): string {
  return /[.?!]$/.test(title) ? `${title} ` : `${title}. `;
}

export function formatAPA(ref: Omit<Reference, "id">): string {
  return [
    ref.authors && `${ref.authors} `,
    // APA 관례상 연도가 없으면 (n.d.)로 표기한다
    `(${ref.year || "n.d."}). `,
    ref.title && titleWithPeriod(ref.title),
    ref.source &&
      // 호(issue)는 권(volume) 뒤에 괄호로 붙는 게 APA 관례다. 권 없이 호만
      // 있으면 "Journal(3)"처럼 붙지 않게 쉼표를 두고 괄호로 쓴다.
      `${ref.source}${
        ref.volume
          ? `, ${ref.volume}${ref.issue ? `(${ref.issue})` : ""}`
          : ref.issue
            ? `, (${ref.issue})`
            : ""
      }${ref.pages ? `, ${ref.pages}` : ""}. `,
    ref.url,
  ]
    .filter(Boolean)
    .join("");
}

export function formatIEEE(ref: Omit<Reference, "id">): string {
  const joined = [
    ref.authors && `${ref.authors}, `,
    // 따옴표 안에서 마침표+쉼표가 겹치지 않게 끝 마침표는 떼어낸다 (?·!는 유지)
    ref.title && `"${ref.title.replace(/\.$/, "")}," `,
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

const REFERENCES_STORAGE_KEY = "research-guide:references";

/** 손상된 저장값(필드 누락·타입 불일치)이 화면·인용 출력에 닿지 않게 항목 단위로 거른다. */
function isReference(value: unknown): value is Reference {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  const optionalOk = (x: unknown) => x === undefined || typeof x === "string";
  return (
    typeof v.id === "string" &&
    typeof v.authors === "string" &&
    typeof v.year === "string" &&
    typeof v.title === "string" &&
    typeof v.source === "string" &&
    optionalOk(v.volume) &&
    optionalOk(v.issue) &&
    optionalOk(v.pages) &&
    optionalOk(v.url)
  );
}

export function readReferences(): Reference[] {
  try {
    const raw = window.localStorage.getItem(REFERENCES_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isReference) : [];
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
