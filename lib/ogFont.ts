import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * OG 이미지용 한글 폰트 로더.
 *
 * next/font의 Google Fonts 자동 다운로드는 빌드 타임에 fonts.gstatic.com에
 * 접속하는데, 이 환경에서 그 요청이 막혀 빌드가 깨진 전례가 있다(레포 히스토리).
 * 그래서 여기서는 네트워크를 전혀 타지 않는다 — 실제 페이지 제목들(자료실
 * 문서 제목, 가이드 단계 제목, 사이트명)에 등장하는 글자만 미리 추출해
 * Noto Sans KR을 서브셋(각 17KB 안팍)으로 한 번 내려받아 assets/fonts/에
 * 커밋해두고, 빌드 시점엔 로컬 파일을 읽기만 한다.
 *
 * 주의: 새 자료실 글/가이드 단계가 추가돼 폰트에 없는 글자가 쓰이면 그
 * 글자만 네모(tofu)로 깨진다 — 그때는 서브셋 폰트를 다시 생성해야 한다.
 */
const FONT_DIR = join(process.cwd(), "assets", "fonts");

let cache: { bold: Buffer; medium: Buffer } | null = null;

export async function loadOgFonts() {
  if (!cache) {
    const [bold, medium] = await Promise.all([
      readFile(join(FONT_DIR, "NotoSansKR-Bold.ttf")),
      readFile(join(FONT_DIR, "NotoSansKR-Medium.ttf")),
    ]);
    cache = { bold, medium };
  }
  return cache;
}
