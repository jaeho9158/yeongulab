import { ImageResponse } from "next/og";
import { getAllStages } from "@/lib/guide";

// 요청 때마다 그리지 않도록 단계 6개를 빌드 시점에 미리 굽는다
// (자료실 OG와 같은 이유).
export function generateStaticParams() {
  return getAllStages().map((s) => ({ stage: s.slug }));
}
import { getStageBySlug } from "@/lib/guide";
import { loadOgFonts } from "@/lib/ogFont";

export const alt = "연구랩 6단계 가이드";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ stage: string }>;
}) {
  const { stage: slug } = await params;
  const stage = getStageBySlug(slug);
  const { bold, medium } = await loadOgFonts();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "96px",
          background: "#ffffff",
          fontFamily: "Noto Sans KR",
        }}
      >
        {stage ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "88px",
              height: "88px",
              borderRadius: "18px",
              background: "#f7f7f8",
              border: "1px solid #e6e7e9",
              fontFamily: "Noto Sans KR Bold",
              fontSize: 36,
              color: "#17181a",
            }}
          >
            {stage.order}
          </div>
        ) : (
          <div style={{ display: "flex" }} />
        )}

        <div
          style={{
            fontFamily: "Noto Sans KR Bold",
            fontSize: 78,
            lineHeight: 1.3,
            color: "#17181a",
            display: "flex",
          }}
        >
          {stage ? `${stage.order}단계 · ${stage.title}` : "연구랩 가이드"}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            paddingTop: "32px",
            borderTop: "1px solid #e6e7e9",
            fontSize: 28,
            color: "#6b7076",
          }}
        >
          연구랩 · 6단계 가이드
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
