// .mts인 이유: package.json에 "type": "module"이 없어 프로젝트 기본값이
// CJS다. Node 24는 .ts를 네이티브로 스트립해 실행할 수 있지만, CJS 진입점에서
// "../lib/ogFontChars.ts"처럼 .ts 확장자를 가진 상대 임포트를 require하면
// 로더가 처리하지 못해 실패한다. .mts로 두면 파일 자체가 항상 ESM으로
// 취급되어 .ts 상대 임포트가 그대로 동작한다.
//
// 다만 임포트되는 lib/ogFontChars.ts는 확장자만으로 모듈 종류를 정할 수 없어
// Node가 MODULE_TYPELESS_PACKAGE_JSON 경고를 낸다. package.json에
// "type": "module"을 넣으면 Next/vitest 설정 해석에 영향을 주므로, npm 스크립트
// 쪽에서 `node --no-warnings=MODULE_TYPELESS_PACKAGE_JSON`으로 이 경고만
// 끈다(Node 24에서 코드 단위 --no-warnings 지원 확인됨). 동작은 그대로다.
import fs from "fs";
import os from "os";
import path from "path";
import { execFileSync } from "child_process";
import { collectSubsetChars } from "../lib/ogFontChars.ts";

const ROOT = process.cwd();

// lib/ogFontChars → lib/articles가 내부적으로 process.cwd() 기준 경로를
// 읽으므로, 이 스크립트는 반드시 저장소 루트에서 실행해야 한다.
if (!fs.existsSync(path.join(ROOT, "content", "articles"))) {
  console.error(
    "content/articles 디렉터리를 찾을 수 없습니다. 이 스크립트는 저장소 루트에서 실행해야 합니다 (예: npm run og-font).",
  );
  process.exit(1);
}

// google/fonts는 NotoSansKR을 가변 폰트 `NotoSansKR[wght].ttf` 하나로만 배포한다.
// 정적 Bold/Medium 파일은 저장소에 존재하지 않으므로, 가변 폰트에서 wght 축을
// 고정(instancing)해 정적 파일을 먼저 만들어야 한다.
//
// 가변 폰트를 그대로 서브셋하지 않는 이유: ImageResponse/satori에는 굵기별 정적
// 파일을 그대로 넘기는 편이 단순하고, 기존 lib/ogFont.ts가 Bold/Medium 두 파일을
// 각각 읽도록 되어 있다.
const WEIGHTS = [
  { name: "Bold", wght: 700 },
  { name: "Medium", wght: 500 },
] as const;
const SRC_DIR = path.join(ROOT, "assets", "fonts", "src");
const OUT_DIR = path.join(ROOT, "assets", "fonts");
const VARIABLE_SRC = path.join(SRC_DIR, "NotoSansKR[wght].ttf");
const VARIABLE_URL =
  "https://github.com/google/fonts/raw/main/ofl/notosanskr/NotoSansKR%5Bwght%5D.ttf";

for (const { name, wght } of WEIGHTS) {
  const src = path.join(SRC_DIR, `NotoSansKR-${name}.ttf`);
  if (fs.existsSync(src)) continue;

  if (!fs.existsSync(VARIABLE_SRC)) {
    // 자동 다운로드는 하지 않는다 (10MB 바이너리를 사용자 동의 없이 받지 않음).
    console.error(
      `원본 폰트가 없습니다: ${src}\n` +
        `google/fonts는 가변 폰트만 배포합니다. 아래 파일을 내려받아 ` +
        `${VARIABLE_SRC} 에 두고 다시 실행하세요.\n` +
        `  ${VARIABLE_URL}`,
    );
    process.exit(1);
  }

  console.log(`가변 폰트에서 ${name}(wght ${wght}) 정적 인스턴스 생성 중...`);
  execFileSync(
    "python",
    [
      "-c",
      [
        "import sys",
        "from fontTools.ttLib import TTFont",
        "from fontTools.varLib.instancer import instantiateVariableFont",
        "src, out, wght = sys.argv[1], sys.argv[2], float(sys.argv[3])",
        "font = TTFont(src)",
        "instantiateVariableFont(font, {'wght': wght}, inplace=True)",
        "font.save(out)",
      ].join("\n"),
      VARIABLE_SRC,
      src,
      String(wght),
    ],
    { stdio: "inherit" },
  );
}

const chars = collectSubsetChars();
const tmpFile = path.join(os.tmpdir(), `og-font-chars-${Date.now()}.txt`);
fs.writeFileSync(tmpFile, chars, "utf-8");

try {
  for (const { name } of WEIGHTS) {
    const src = path.join(SRC_DIR, `NotoSansKR-${name}.ttf`);
    const out = path.join(OUT_DIR, `NotoSansKR-${name}.ttf`);

    execFileSync(
      "python",
      [
        "-m",
        "fontTools.subset",
        src,
        `--text-file=${tmpFile}`,
        `--output-file=${out}`,
        "--layout-features=",
        "--no-hinting",
        "--desubroutinize",
      ],
      { stdio: "inherit" },
    );

    const size = fs.statSync(out).size;
    const kb = (size / 1024).toFixed(1);
    console.log(`${out}: ${kb} KB`);
    if (size > 50 * 1024) {
      console.warn(
        `경고: ${name} 서브셋이 50KB를 넘었습니다 (${kb} KB) — 글자가 예상보다 많이 늘었을 수 있습니다.`,
      );
    }
  }
} finally {
  fs.rmSync(tmpFile, { force: true });
}
