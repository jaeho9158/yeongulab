import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AdSlot } from "@/components/AdSlot";
import { ADSENSE_CLIENT_ID, OPERATOR, SITE_NAME, SITE_URL } from "@/lib/site";

// 연구할Lab 전용 GA4 속성의 웹 스트림(www.yeonguhallab.kr, 스트림 15744491182).
// 이 값은 GA4 관리 > 데이터 스트림에 적힌 "측정 ID"와 반드시 같아야 한다 —
// 예전 값(G-DLLMF7BYPR)은 어느 스트림에도 없는 ID였고, 그동안의 방문 기록이
// 어디에도 쌓이지 않았다. 바꿀 일이 생기면 눈으로 대조하고 바꿔라.
const GA_MEASUREMENT_ID = "G-TLT7TPCHBG";

// "청소년 연구 6단계 가이드"를 앞에 두는 이유 — "연구할Lab"은 아무도 모르는
// 신규 브랜드라 그 이름만으로는 검색되지 않는다(이전 이름 "연구랩"은 흔한
// 일반명사라 묻혔고, 지금은 반대로 아직 아무도 안 찾는다 — 결론은 같다).
// 실제로 사람들이 찾을 법한 구절(청소년 연구 6단계 가이드)을 타이틀 맨 앞에
// 그대로 넣어야 그 검색어와 일치해 노출 확률이 올라가고, 검색결과에서도
// 일치한 구절이 굵게 강조된다.
const SITE_TITLE = "청소년 연구 6단계 가이드 — 연구할Lab";
const SITE_DESCRIPTION =
  "청소년 연구 6단계 가이드. 주제 선정부터 논문 투고까지 무료로 따라갈 수 있습니다. 로그인 없이 바로 시작하세요.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | 연구할Lab",
  },
  description: SITE_DESCRIPTION,
  // "./"는 현재 경로 기준으로 풀린다 — 페이지마다 자기 URL이 canonical이 된다
  alternates: { canonical: "./" },
  // title·description을 여기에 쓰지 마라(NX1). 하위 세그먼트가 openGraph를
  // 정의하지 않으면 이 객체가 통째로 상속되고, 런타임의 자동 폴백도
  // "openGraph에 이미 값이 있으면 페이지 title로 덮어쓰지 않는다"라
  // 51개 페이지의 og:title이 전부 사이트 제목으로 고정된다.
  // 비워 두면 각 페이지의 title·description이 그대로 채워진다.
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: SITE_NAME,
    url: "./",
  },
  authors: [{ name: OPERATOR.name }],
  creator: OPERATOR.name,
  // opengraph-image 파일 규약으로 큰 썸네일을 만들었으니 트위터 카드도
  // "summary"(작은 정사각 썸네일)에서 큰 이미지 카드로 올린다.
  twitter: { card: "summary_large_image" },
  verification: {
    other: {
      // 두 값을 함께 내보낸다(배열이면 같은 name의 meta가 두 개 렌더된다).
      // 네이버 소유확인 코드는 등록한 사이트 주소마다 다르게 발급되는데,
      // 옛 주소(yeongulab.vercel.app)는 애드센스 심사가 진행 중이라 아직
      // 닫을 수 없다. 하나만 남기면 다른 쪽 등록이 소유확인에서 풀린다.
      "naver-site-verification": [
        "c7f1e3c35aa472608a8c9e9f53cf0dd987bed1fc", // www.yeonguhallab.kr
        "65d6516f9b1748e2c9238a53c6d469a728445806", // yeongulab.vercel.app
      ],
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
      <body className="min-h-full flex flex-col">
        {/* 이 두 스크립트를 <head>에 직접 쓰지 않는 이유 — React 19는 `<script
            async src>`를 hoistable resource로 보고 head의 리소스 슬롯으로
            끌어올리지만, dangerouslySetInnerHTML을 쓴 인라인 <script>는
            호이스팅 대상이 아니라 작성 위치에 남는다. 우리가 <head>를 직접
            작성하면 React가 그 head를 일반 host 엘리먼트로 보고 자식을 "위치
            기준"으로 하이드레이트하는데, 실제 DOM 순서는 호이스팅 때문에
            어긋나 있어서 모든 페이지에서 하이드레이션 mismatch가 났다.
            (<html suppressHydrationWarning>은 그 엘리먼트 자신의 속성/텍스트만
            억제하므로 head 자식 순서 불일치를 못 막는다.)
            <head>를 아예 작성하지 않으면 React가 head를 전적으로 리소스
            호이스팅 시스템으로 관리해 위치 매칭 자체가 일어나지 않는다. */}

        {/* 테마 선택을 hydration 전에 <html>에 반영 — 그렇지 않으면 라이트로
            그렸다가 다크로 바뀌는 깜빡임(FOUC)이 발생한다. body 첫 자식이라
            본문 파싱 전에, 그리고 head의 스타일시트 뒤에 실행되므로 첫 페인트
            전에 data-theme이 확정된다. 저장된 값이 없으면 data-theme을 아예 안
            붙여서 시스템 설정(prefers-color-scheme)을 그대로 따른다. */}
        <script
          id="theme-init"
          suppressHydrationWarning
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
            여기서는 순수 HTML 태그로 직접 렌더링한다. body에 써도 React 19가
            SSR 시 head로 호이스팅하므로 초기 HTML의 <head> 안에 진짜 <script>
            태그로 남는다. */}
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
          crossOrigin="anonymous"
        />
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
