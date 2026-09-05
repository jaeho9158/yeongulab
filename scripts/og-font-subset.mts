// .mts인 이유: package.json에 "type": "module"이 없어 프로젝트 기본값이
// CJS다. Node 24는 .ts를 네이티브로 스트립해 실행할 수 있지만, CJS 진입점에서
// "../lib/ogFontChars.ts"처럼 .ts 확장자를 가진 상대 임포트를 require하면
// 로더가 처리하지 못해 실패한다. .mts로 두면 파일 자체가 항상 ESM으로
// 취급되어 .ts 상대 임포트가 그대로 동작한다.
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

const WEIGHTS = ["Bold", "Medium"] as const;
const SRC_DIR = path.join(ROOT, "assets", "fonts", "src");
const OUT_DIR = path.join(ROOT, "assets", "fonts");

for (const weight of WEIGHTS) {
  const src = path.join(SRC_DIR, `NotoSansKR-${weight}.ttf`);
  if (!fs.existsSync(src)) {
    console.error(
      `원본 폰트가 없습니다: ${src}\n` +
        `https://github.com/google/fonts/tree/main/ofl/notosanskr 에서 ` +
        `NotoSansKR-${weight}.ttf 를 내려받아 해당 경로에 두세요.`,
    );
    process.exit(1);
  }
}

const chars = collectSubsetChars();
const tmpFile = path.join(os.tmpdir(), `og-font-chars-${Date.now()}.txt`);
fs.writeFileSync(tmpFile, chars, "utf-8");

try {
  for (const weight of WEIGHTS) {
    const src = path.join(SRC_DIR, `NotoSansKR-${weight}.ttf`);
    const out = path.join(OUT_DIR, `NotoSansKR-${weight}.ttf`);

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
        `경고: ${weight} 서브셋이 50KB를 넘었습니다 (${kb} KB) — 글자가 예상보다 많이 늘었을 수 있습니다.`,
      );
    }
  }
} finally {
  fs.rmSync(tmpFile, { force: true });
}
