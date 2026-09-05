import { ImageResponse } from "next/og";
import { loadOgFonts } from "@/lib/ogFont";

// 사이트 기본 OG 이미지 — 문서/단계별 og 파일이 없는 페이지가 이걸 쓴다.
export const alt = "연구랩 — 청소년 연구 6단계 가이드";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const { bold, medium } = await loadOgFonts();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "96px",
          background: "#ffffff",
          fontFamily: "Noto Sans KR",
        }}
      >
        {/* 6단계를 상징하는 절제된 그래픽 — 진행 중인 한 칸만 강조색 */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "56px" }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                width: "56px",
                height: "10px",
                borderRadius: "5px",
                background: i === 2 ? "#2f6f4f" : "#e6e7e9",
              }}
            />
          ))}
        </div>

        <div
          style={{
            fontSize: 116,
            fontFamily: "Noto Sans KR Bold",
            color: "#17181a",
            lineHeight: 1.1,
            display: "flex",
          }}
        >
          연구랩
        </div>

        <div
          style={{
            marginTop: "28px",
            fontSize: 42,
            color: "#6b7076",
            display: "flex",
          }}
        >
          청소년 연구 6단계 가이드
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Noto Sans KR", data: medium, style: "normal", weight: 500 },
        { name: "Noto Sans KR Bold", data: bold, style: "normal", weight: 700 },
      ],
    }
  );
}
