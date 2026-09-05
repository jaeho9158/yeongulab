import { ImageResponse } from "next/og";
import { getAllShowcases, getShowcaseBySlug } from "@/lib/showcase";
import { loadOgFonts } from "@/lib/ogFont";

// 사례는 링크를 공유하라고 만든 페이지다. 요청 때마다 서버에서 그리면 처음
// 공유한 사람이 크롤러 지연을 떠안고, 느리면 썸네일이 아예 안 뜬다.
// 사례 목록은 빌드 시점에 다 알 수 있으니 미리 구워둔다.
export function generateStaticParams() {
  return getAllShowcases().map((s) => ({ slug: s.slug }));
}

export const alt = "연구랩 연구 사례";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const showcase = getShowcaseBySlug(slug);
  const title = showcase?.title ?? "연구랩 연구 사례";
  const { bold, medium } = await loadOgFonts();

  // 사례 제목은 자료실 글보다 훨씬 길다(em dash로 앞뒤 절을 잇는 형태라
  // 40자를 넘는 것이 보통). 카드 밖으로 밀려나지 않도록 자료실보다 더 낮은
  // 단계까지 폰트 크기를 떨어뜨린다 — 줄바꿈은 satori가 알아서 한다.
  const fontSize =
    title.length > 36 ? 44 : title.length > 26 ? 52 : title.length > 18 ? 60 : 70;

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
          연구 사례
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
          연구랩 · 연구 사례
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
