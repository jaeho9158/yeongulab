/**
 * 자료실 본문(MDX)에서 사이트 내부 링크만 뽑아내는 헬퍼.
 *
 * 글끼리 서로 링크를 걸다 보면 아직 쓰지 않은 slug나 오타난 단계 slug가
 * 그대로 배포되어 404로 이어진다. 렌더링 시점엔 아무 에러도 나지 않으므로
 * (Next.js Link는 존재하지 않는 경로도 그냥 그린다) 텍스트 단계에서
 * 뽑아내 테스트로 막는다.
 */

export type InternalLink = {
  /** 프래그먼트를 뗀 경로. 항상 "/"로 시작한다. */
  path: string;
  /** "#" 뒤 앵커. 없으면 undefined */
  hash?: string;
};

/** ``` 또는 ~~~ 로 감싼 코드 블록 — 예시 코드 속 링크는 실제 링크가 아니다. */
const FENCE_RE = /^\s*(```|~~~)/;

/** [텍스트](/경로) 형태의 마크다운 링크. 제목 속성("...")은 무시한다. */
const LINK_RE = /\[[^\]]*\]\(\s*(\/[^\s)]*)\s*(?:"[^"]*")?\)/g;

export function extractInternalLinks(markdown: string): InternalLink[] {
  const links: InternalLink[] = [];
  let inFence = false;

  for (const line of markdown.split("\n")) {
    if (FENCE_RE.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    for (const match of line.matchAll(LINK_RE)) {
      const href = match[1];
      // http(s):·mailto:·#앵커만 있는 링크는 정규식이 이미 걸러낸다(/로 시작 요구).
      const hashIndex = href.indexOf("#");
      if (hashIndex === -1) {
        links.push({ path: href });
      } else {
        links.push({
          path: href.slice(0, hashIndex),
          hash: href.slice(hashIndex + 1),
        });
      }
    }
  }

  return links;
}
