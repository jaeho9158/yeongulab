/**
 * 개인 연락처·외부 채널 유도 탐지.
 *
 * 목적은 차단이 아니라 경고와 기록이다. 완벽한 탐지는 불가능하고, 정상적인 자문을
 * 막으면(예: 논문 DOI 링크) 기능 자체가 못 쓰게 된다. 그래서 오탐을 줄이는 쪽으로
 * 규칙을 짰고, 걸린 메시지는 보내되 양쪽에 경고를 띄우고 운영자에게 표시한다.
 */

export type ContactKind = "전화번호" | "이메일" | "메신저" | "외부 화상";

export type ContactHit = { kind: ContactKind; match: string };

/** 학술 자문에서 정상적으로 오가는 링크는 탐지 대상에서 뺀다. */
const ALLOWED_HOSTS = [
  "doi.org",
  "arxiv.org",
  "scholar.google.com",
  "pubmed.ncbi.nlm.nih.gov",
];

const RULES: { kind: ContactKind; re: RegExp }[] = [
  // 010으로 시작하는 11자리. 구분자는 없거나 - 또는 .
  { kind: "전화번호", re: /01[016789][-.]?\d{3,4}[-.]?\d{4}/g },
  { kind: "이메일", re: /[\w.+-]+@[\w-]+\.[\w.-]+/g },
  {
    kind: "메신저",
    re: /(카톡|카카오톡|인스타|instagram|텔레그램|telegram|디스코드|discord|라인아이디)/gi,
  },
  {
    kind: "외부 화상",
    re: /(zoom\.us|meet\.google\.com|teams\.microsoft\.com|webex\.com)/gi,
  },
];

export function detectContactInfo(text: string): ContactHit[] {
  const hits: ContactHit[] = [];
  for (const rule of RULES) {
    // lastIndex가 남지 않도록 매번 새 정규식을 쓴다
    const re = new RegExp(rule.re.source, rule.re.flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const match = m[0];
      if (ALLOWED_HOSTS.some((host) => match.includes(host))) continue;
      hits.push({ kind: rule.kind, match });
    }
  }
  return hits;
}

export function hasContactInfo(text: string): boolean {
  return detectContactInfo(text).length > 0;
}

export const CONTACT_WARNING =
  "개인 연락처나 외부 메신저로 대화를 옮기지 마세요. 이 사이트 안에서 주고받은 내용만 기록으로 남아 보호받을 수 있습니다.";
