import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AdSlot } from "@/components/AdSlot";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const GA_MEASUREMENT_ID = "G-DLLMF7BYPR";
const ADSENSE_CLIENT_ID = "ca-pub-7710727724213886";

const SITE_TITLE = "연구랩 가이드 — 청소년 연구 로드맵";
const SITE_DESCRIPTION =
  "청소년이 연구 주제 선정부터 논문 투고까지 6단계로 따라갈 수 있는 무료 가이드.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | 연구랩 가이드",
  },
  description: SITE_DESCRIPTION,
  // "./"는 현재 경로 기준으로 풀린다 — 페이지마다 자기 URL이 canonical이 된다
  alternates: { canonical: "./" },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "./",
  },
  twitter: { card: "summary" },
  verification: {
    other: {
      "naver-site-verification": "65d6516f9b1748e2c9238a53c6d469a728445806",
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#101113" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <head>
        {/* 테마 선택을 hydration 전에 <html>에 반영 — 그렇지 않으면 라이트로
            그렸다가 다크로 바뀌는 깜빡임(FOUC)이 발생한다. 저장된 값이 없으면
            data-theme을 아예 안 붙여서 시스템 설정(prefers-color-scheme)을
            그대로 따른다. */}
        <script
          id="theme-init"
          dangerouslySetInnerHTML={{
            __html: `try {
              var t = localStorage.getItem("research-guide:theme");
              if (t === "light" || t === "dark") {
                document.documentElement.setAttribute("data-theme", t);
              }
            } catch (e) {}`,
          }}
        />
        {/* AdSense 소유권 확인은 초기 HTML에 실제 <script> 태그가 있어야 크롤러가
            인식한다 — next/script의 beforeInteractive는 SSR 출력에 <link
            rel="preload">만 남기고 실제 태그는 클라이언트에서 주입하므로
            여기서는 순수 HTML 태그로 직접 렌더링한다. */}
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>

        <div className="print:hidden">
          <SiteHeader />
        </div>
        <main className="flex-1">{children}</main>
        <div className="print:hidden">
          <SiteFooter />
        </div>

        {/* PC 전용 좌우 광고 레일 — 본문 폭(max-w-3xl=48rem) 바깥 여백에 고정.
            단계 페이지 본문 폭이 60rem(960px)으로 넓어져 여백이 176px(광고폭160+여유16)
            이상 나오는 1536px(2xl)부터 노출. */}
        <div className="fixed top-24 left-4 z-0 hidden 2xl:block print:hidden">
          <AdSlot label="좌측 광고" variant="rail" />
        </div>
        <div className="fixed top-24 right-4 z-0 hidden 2xl:block print:hidden">
          <AdSlot label="우측 광고" variant="rail" />
        </div>
      </body>
    </html>
  );
}
