import fs from "fs";
import path from "path";
import { describe, it, expect } from "vitest";
import { collectRenderedChars } from "../ogFontChars";

/**
 * OG 이미지용 폰트는 용량 때문에 "지금 쓰이는 글자"만 담은 서브셋이다
 * (lib/ogFont.ts 참고). 새 자료실 글이나 단계가 추가돼 서브셋에 없는 글자가
 * 제목에 들어가면 그 글자만 네모(tofu)로 깨지는데, OG 이미지는 링크를 공유할
 * 때만 보이므로 **아무도 모르게** 깨진다. 그래서 커버리지를 테스트로 고정한다.
 *
 * 이 테스트가 깨지면 서브셋 폰트를 다시 만들어야 한다는 뜻이다.
 */

const FONT_DIR = path.join(process.cwd(), "assets", "fonts");

/** TrueType 폰트가 실제로 글리프를 가진 코드포인트 집합을 cmap에서 읽는다. */
function coveredCodePoints(font: Buffer): Set<number> {
  const covered = new Set<number>();
  const numTables = font.readUInt16BE(4);

  let cmapOffset = -1;
  for (let i = 0; i < numTables; i++) {
    const rec = 12 + i * 16;
    if (font.toString("ascii", rec, rec + 4) === "cmap") {
      cmapOffset = font.readUInt32BE(rec + 8);
      break;
    }
  }
  if (cmapOffset < 0) return covered;

  // 유니코드 서브테이블을 모두 훑는다 — 어느 하나만 봐도 되지만, 폰트마다
  // 어떤 포맷을 넣는지 달라서 있는 대로 합집합을 취하는 편이 안전하다.
  const subCount = font.readUInt16BE(cmapOffset + 2);
  for (let i = 0; i < subCount; i++) {
    const rec = cmapOffset + 4 + i * 8;
    const sub = cmapOffset + font.readUInt32BE(rec + 4);
    const format = font.readUInt16BE(sub);

    if (format === 4) {
      const segCount = font.readUInt16BE(sub + 6) / 2;
      const endBase = sub + 14;
      const startBase = endBase + segCount * 2 + 2;
      const deltaBase = startBase + segCount * 2;
      const rangeBase = deltaBase + segCount * 2;

      for (let s = 0; s < segCount; s++) {
        const end = font.readUInt16BE(endBase + s * 2);
        const start = font.readUInt16BE(startBase + s * 2);
        if (start === 0xffff) continue; // 종료 세그먼트
        const delta = font.readInt16BE(deltaBase + s * 2);
        const rangeOffsetPos = rangeBase + s * 2;
        const rangeOffset = font.readUInt16BE(rangeOffsetPos);

        for (let c = start; c <= end && c !== 0xffff; c++) {
          let gid: number;
          if (rangeOffset === 0) {
            gid = (c + delta) & 0xffff;
          } else {
            const gi = rangeOffsetPos + rangeOffset + (c - start) * 2;
            if (gi + 1 >= font.length) continue;
            gid = font.readUInt16BE(gi);
            if (gid !== 0) gid = (gid + delta) & 0xffff;
          }
          if (gid !== 0) covered.add(c);
        }
      }
    } else if (format === 12) {
      const numGroups = font.readUInt32BE(sub + 12);
      for (let g = 0; g < numGroups; g++) {
        const rec2 = sub + 16 + g * 12;
        const start = font.readUInt32BE(rec2);
        const end = font.readUInt32BE(rec2 + 4);
        const startGid = font.readUInt32BE(rec2 + 8);
        if (startGid === 0) continue;
        for (let c = start; c <= end; c++) covered.add(c);
      }
    }
  }
  return covered;
}

describe("OG 서브셋 폰트 커버리지", () => {
  const fonts = ["NotoSansKR-Bold.ttf", "NotoSansKR-Medium.ttf"];

  it("두 폰트 파일이 존재하고 비어 있지 않다", () => {
    for (const name of fonts) {
      const p = path.join(FONT_DIR, name);
      expect(fs.existsSync(p)).toBe(true);
      expect(fs.statSync(p).size).toBeGreaterThan(1000);
    }
  });

  it("cmap 파서가 흔한 글자를 인식한다 (파서 자체 점검)", () => {
    const covered = coveredCodePoints(
      fs.readFileSync(path.join(FONT_DIR, "NotoSansKR-Bold.ttf")),
    );
    // "연구랩"은 모든 OG 이미지에 들어가므로 반드시 있어야 한다.
    // 이게 실패하면 커버리지 부족이 아니라 파서가 잘못된 것이다.
    for (const ch of "연구랩") {
      expect(covered.has(ch.codePointAt(0)!)).toBe(true);
    }
  });

  it.each(fonts)("%s 가 OG에 그려지는 모든 글자를 담고 있다", (name) => {
    const covered = coveredCodePoints(fs.readFileSync(path.join(FONT_DIR, name)));

    const needed = collectRenderedChars();

    const missing = [...needed].filter(
      (ch) => !covered.has(ch.codePointAt(0)!),
    );

    // 실패 시 어떤 글자를 서브셋에 추가해야 하는지 바로 보이게 한다
    expect(
      missing,
      `서브셋 폰트에 없는 글자: ${missing.join("")} — assets/fonts 재생성 필요`,
    ).toEqual([]);
  });
});
