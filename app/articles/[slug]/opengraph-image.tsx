import { ImageResponse } from "next/og";
import { getAllArticles, getArticleBySlug } from "@/lib/articles";
import { loadOgFonts } from "@/lib/ogFont";

// 이게 없으면 OG 이미지가 요청 때마다 서버에서 그려진다. 링크를 처음 공유한
// 사람이 크롤러 지연을 떠안고, 느리면 썸네일이 아예 안 뜬다. 문서 목록은
// 빌드 시점에 다 알 수 있으니 미리 구워둔다.
export function generateStaticParams() {
  return getAllArticles().map((a) => ({ slug: a.slug }));
}

export const alt = "연구랩 자료실";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  const title = article?.title ?? "연구랩 자료실";
  const { bold, medium } = await loadOgFonts();

  // 제목이 길면(예: "발표와 포스터: 심사장에서 실제로 통하는 것") 기본
  // 크기로 두 줄을 넘어갈 수 있어 글자 수 기준으로 폰트 크기를 낮춘다.
  const fontSize = title.length > 18 ? 60 : title.length > 12 ? 70 : 84;

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
        <div
          style={{
            fontFamily: "Noto Sans KR Bold",
            fontSize: 24,
            letterSpacing: "0.08em",
            color: "#2f6f4f",
            display: "flex",
          }}
        >
          자료실
        </div>

        <div
          style={{
            fontFamily: "Noto Sans KR Bold",
            fontSize,
            lineHeight: 1.3,
            color: "#17181a",
            display: "flex",
          }}
        >
          {title}
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
          연구랩 · 자료실
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
