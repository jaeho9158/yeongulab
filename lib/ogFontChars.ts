import fs from "fs";
import path from "path";
import { getAllArticles } from "./articles.ts";
import { getAllStages } from "./guide.ts";
import { getAllShowcases } from "./showcase.ts";

/** OG 이미지 컴포넌트 소스 — 실제로 화면에 그려지는 한글을 여기서 뽑는다. */
export const OG_SOURCES = [
  "app/opengraph-image.tsx",
  "app/articles/[slug]/opengraph-image.tsx",
  "app/guide/[stage]/opengraph-image.tsx",
  "app/showcase/[slug]/opengraph-image.tsx",
];

/** OG 컴포넌트 소스에 박힌 한글 — 문자열을 복사해두면 컴포넌트를 고쳤을 때
 *  옛 문자열을 검사하게 되므로 소스에서 직접 뽑는다.
 *
 *  주석의 한글은 화면에 그려지지 않으므로 반드시 먼저 걷어낸다. 안 그러면
 *  "왜" 주석을 한글로 쓰는 이 저장소의 관례 때문에 서브셋에 불필요한 글자가
 *  섞여 들어간다. */
function hangulInSources(): string {
  return (
    OG_SOURCES.map((rel) => {
      const file = path.join(process.cwd(), rel);
      if (!fs.existsSync(file)) return "";
      return fs
        .readFileSync(file, "utf-8")
        .replace(/\/\*[\s\S]*?\*\//g, " ") // 블록 주석
        .replace(/(^|[^:])\/\/.*$/gm, "$1"); // 줄 주석 (URL의 // 는 남긴다)
    })
      .join("")
      .match(/[가-힣]/g)
      ?.join("") ?? ""
  );
}

// 숫자·괄호·따옴표는 제목에 언제든 들어올 수 있다 — 그때마다 서브셋을
// 재생성하지 않도록 흔히 쓰이는 문장부호·ASCII를 미리 포함해둔다.
const SAFETY_SET =
  " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~" +
  "·—–…‘’“”「」";

/** 지금 실제로 OG 이미지에 그려지는 글자만 모아 중복 없는 문자열로 돌려준다.
 *
 *  테스트는 "지금 그려지는 글자"만 검사해야 원본 폰트 없이도 초록이다.
 *  안전 집합(SAFETY_SET)은 서브셋 재생성 빈도를 줄이려는 장치일 뿐 화면에
 *  그려지는 글자가 아니므로, 커버리지 검사에는 넣지 않고 스크립트에만 붙인다. */
export function collectRenderedChars(): string {
  const needed = new Set<string>();
  const add = (s: string) => {
    for (const ch of s) if (ch.trim()) needed.add(ch);
  };

  add(hangulInSources());
  for (const a of getAllArticles()) add(a.title);
  for (const s of getAllStages()) add(s.title);
  // 사례 제목도 OG 카드에 그대로 그려진다. 사례 제목은 자료실 글과 어휘가
  // 달라(실험 재료·기법 이름 등) 여기서 빠뜨리면 그 글자만 네모로 깨진다.
  for (const s of getAllShowcases()) add(s.title);

  return [...needed].join("");
}

/** 서브셋 폰트에 실제로 담을 글자 — 그려지는 글자 + 안전 집합.
 *  scripts/og-font-subset.mts 전용이다. */
export function collectSubsetChars(): string {
  const needed = new Set<string>();
  for (const ch of collectRenderedChars()) needed.add(ch);
  for (const ch of SAFETY_SET) if (ch.trim()) needed.add(ch);
  return [...needed].join("");
}
